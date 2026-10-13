import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzhFi83TQYmKjZjtHqBZzVRN-GlXyUjvo",
    authDomain: "gastos-culinarios.firebaseapp.com",
    projectId: "gastos-culinarios",
    storageBucket: "gastos-culinarios.firebasestorage.app",
    messagingSenderId: "789890363262",
    appId: "1:789890363262:web:044439da8398e5c0484d2f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Manejo de Login
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container");
const formLogin = document.getElementById("form-login");
const inputUsuario = document.getElementById("login-usuario");
const inputPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

function verificarSesion() {
    if (sessionStorage.getItem("auth_custo") === "true") {
        loginContainer.classList.add("hidden");
        appContainer.classList.remove("hidden");
        inicializarApp();
    }
}

formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = inputUsuario.value.trim();
    const password = inputPassword.value.trim();

    if (usuario === "DRPEREYRA" && password === "235689") {
        sessionStorage.setItem("auth_custo", "true");
        loginContainer.classList.add("hidden");
        appContainer.classList.remove("hidden");
        inicializarApp();
    } else {
        loginError.classList.remove("hidden");
    }
});

// Funcionalidad del botón Salir
const btnSalir = document.getElementById("btn-salir");
if (btnSalir) {
    btnSalir.addEventListener("click", () => {
        sessionStorage.removeItem("auth_custo");
        window.location.reload();
    });
}

let cacheIngredientes = {};
let cacheRecetas = [];
let calculoActualMemoria = null;

const selectReceta = document.getElementById("select-receta");
const inputComensales = document.getElementById("input-comensales");
const btnCalcular = document.getElementById("btn-calcular");
const resultadoContainer = document.getElementById("resultado-container");
const tablaCuerpo = document.getElementById("tabla-ingredientes-cuerpo");
const recetaNombre = document.getElementById("receta-nombre");
const labelCantComensales = document.getElementById("label-cant-comensales");
const txtLoteComensales = document.getElementById("txt-lote-comensales");
const costoUnitarioSpan = document.getElementById("costo-unitario");
const costoTotalSpan = document.getElementById("costo-total");
const mensajeEstado = document.getElementById("mensaje-estado");
const imagenRecetaContainer = document.getElementById("imagen-receta-container");
const recetaFoto = document.getElementById("receta-foto");

const inputFecha = document.getElementById("input-fecha");
const btnRegistrar = document.getElementById("btn-registrar");
const mensajeRegistro = document.getElementById("mensaje-registro");
const tablaHistoricoCuerpo = document.getElementById("tabla-historico-cuerpo");
const totalHistoricoSpan = document.getElementById("total-historico");

function inicializarFechaHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
}

async function inicializarApp() {
    try {
        inicializarFechaHoy();
        mensajeEstado.textContent = "Sincronizando con base de datos...";
        
        cacheIngredientes = {};
        const qIng = await getDocs(collection(db, "ingredientes"));
        qIng.forEach(docSnap => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        const qRec = await getDocs(collection(db, "recetas"));
        cacheRecetas = [];
        selectReceta.innerHTML = '<option value="">-- Seleccione un plato del menú tipo --</option>';
        qRec.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            cacheRecetas.push(data);
            const opt = document.createElement("option");
            opt.value = data.id;
            opt.textContent = data.nombre;
            selectReceta.appendChild(opt);
        });

        await cargarHistoricoEstadisticas();
        mensajeEstado.textContent = "";
    } catch (error) {
        console.error("Error al inicializar:", error);
        mensajeEstado.textContent = "Error al conectar con la base de datos.";
    }
}

function calcularCostoReceta() {
    const recetaId = selectReceta.value;
    const comensalesDeseados = parseInt(inputComensales.value) || 1;

    if (!recetaId) {
        alert("Por favor, seleccione un plato del menú.");
        return;
    }

    const receta = cacheRecetas.find(r => r.id === recetaId);
    if (!receta) return;

    recetaNombre.textContent = receta.nombre;
    labelCantComensales.textContent = comensalesDeseados;
    txtLoteComensales.textContent = comensalesDeseados;
    tablaCuerpo.innerHTML = "";

    if (receta.imagen) {
        recetaFoto.src = receta.imagen;
        imagenRecetaContainer.classList.remove("hidden");
    } else {
        imagenRecetaContainer.classList.add("hidden");
    }

    const porcionesBaseReceta = receta.porciones || 1;
    let costoTotalLote = 0;

    receta.ingredientes.forEach(item => {
        const ingInfo = cacheIngredientes[item.idIngrediente];
        if (ingInfo) {
            let cantidadParaLote = (item.cantidad / porcionesBaseReceta) * comensalesDeseados;
            let divisor = (ingInfo.unidad === "kg" || ingInfo.unidad === "litro") ? 1000 : 1;

            let costoParcial = (cantidadParaLote / divisor) * ingInfo.precioUnitario;
            costoTotalLote += costoParcial;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${ingInfo.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${cantidadParaLote.toFixed(1)} ${ingInfo.unidad}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${ingInfo.precioUnitario.toFixed(2)} / ${ingInfo.unidad}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoParcial.toFixed(2)}</td>
            `;
            tablaCuerpo.appendChild(tr);
        }
    });

    const costoPorcionIndividual = costoTotalLote / comensalesDeseados;

    costoUnitarioSpan.textContent = `R$ ${costoPorcionIndividual.toFixed(2)}`;
    costoTotalSpan.textContent = `R$ ${costoTotalLote.toFixed(2)}`;
    resultadoContainer.classList.remove("hidden");

    calculoActualMemoria = {
        fecha: inputFecha.value,
        nombrePlato: receta.nombre,
        comensales: comensalesDeseados,
        costoTotal: costoTotalLote
    };
}

async function registrarEstadistica() {
    if (!calculoActualMemoria) {
        alert("Primero debes calcular el costo de un plato.");
        return;
    }

    calculoActualMemoria.fecha = inputFecha.value;

    try {
        mensajeRegistro.textContent = "Guardando en estadísticas...";
        mensajeRegistro.classList.remove("hidden", "text-red-600");
        mensajeRegistro.classList.add("text-emerald-600");

        await addDoc(collection(db, "produccion_historico"), calculoActualMemoria);

        mensajeRegistro.textContent = "¡Registro guardado en estadísticas con éxito!";
        await cargarHistoricoEstadisticas();

        setTimeout(() => {
            mensajeRegistro.classList.add("hidden");
        }, 4000);

    } catch (error) {
        console.error("Error al registrar estadística:", error);
        mensajeRegistro.textContent = "Error al guardar el registro.";
        mensajeRegistro.classList.remove("text-emerald-600");
        mensajeRegistro.classList.add("text-red-600");
    }
}

async function cargarHistoricoEstadisticas() {
    try {
        const querySnapshot = await getDocs(collection(db, "produccion_historico"));
        tablaHistoricoCuerpo.innerHTML = "";
        let acumuladoTotal = 0;

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            acumuladoTotal += data.costoTotal || 0;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-2 px-3 text-slate-600">${data.fecha}</td>
                <td class="py-2 px-3 font-medium text-slate-800">${data.nombrePlato}</td>
                <td class="py-2 px-3 text-slate-600">${data.comensales}</td>
                <td class="py-2 px-3 text-right font-semibold text-slate-900">R$ ${data.costoTotal.toFixed(2)}</td>
            `;
            tablaHistoricoCuerpo.appendChild(tr);
        });

        totalHistoricoSpan.textContent = `Total Acumulado: R$ ${acumuladoTotal.toFixed(2)}`;

        if (querySnapshot.empty) {
            tablaHistoricoCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-400 text-xs">No hay registros históricos todavía.</td></tr>`;
        }

    } catch (error) {
        console.error("Error al cargar histórico:", error);
    }
}

btnCalcular.addEventListener("click", calcularCostoReceta);
btnRegistrar.addEventListener("click", registrarEstadistica);

// Ejecutar verificación de sesión inmediatamente al cargar el módulo
verificarSesion();
