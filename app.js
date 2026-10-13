import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.intentarLogin = function(e) {
    e.preventDefault();
    const usuario = document.getElementById("login-usuario").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const loginError = document.getElementById("login-error");

    if (usuario === "DRPEREYRA" && password === "235689") {
        sessionStorage.setItem("auth_custo", "true");
        document.getElementById("login-container").classList.add("hidden");
        document.getElementById("app-container").classList.remove("hidden");
        inicializarApp();
    } else {
        loginError.classList.remove("hidden");
    }
};

function verificarSesion() {
    if (sessionStorage.getItem("auth_custo") === "true") {
        document.getElementById("login-container").classList.add("hidden");
        document.getElementById("app-container").classList.remove("hidden");
        inicializarApp();
    }
}

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
    if (inputFecha) inputFecha.value = hoy;
}

async function inicializarApp() {
    try {
        inicializarFechaHoy();
        if (mensajeEstado) mensajeEstado.textContent = "Sincronizando con base de datos...";
        
        cacheIngredientes = {};
        const qIng = await getDocs(collection(db, "ingredientes"));
        qIng.forEach(docSnap => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        const qRec = await getDocs(collection(db, "recetas"));
        cacheRecetas = [];
        if (selectReceta) {
            selectReceta.innerHTML = '<option value="">-- Seleccione un plato del menú tipo --</option>';
            qRec.forEach(docSnap => {
                const data = { id: docSnap.id, ...docSnap.data() };
                cacheRecetas.push(data);
                const opt = document.createElement("option");
                opt.value = data.id;
                opt.textContent = data.nombre;
                selectReceta.appendChild(opt);
            });
        }

        await cargarHistoricoEstadisticas();
        if (mensajeEstado) mensajeEstado.textContent = "";
    } catch (error) {
        console.error("Error al inicializar:", error);
        if (mensajeEstado) mensajeEstado.textContent = "Error al conectar con la base de datos.";
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

    const porcionesBaseReceta = parseFloat(receta.porciones) || 1;
    let costoTotalLote = 0;

    receta.ingredientes.forEach(item => {
        const ingInfo = cacheIngredientes[item.idIngrediente];
        if (ingInfo) {
            const cantidadBaseReceta = Number(String(item.cantidad).replace(',', '.')) || 0;
            const precioUnitario = Number(String(ingInfo.precioUnitario).replace(',', '.')) || 0;
            
            let cantidadParaLote = (cantidadBaseReceta / porcionesBaseReceta) * comensalesDeseados;
            
            let costoParcial = 0;
            let textoCantidadMostrar = "";

            if (ingInfo.unidad === "kg") {
                if (cantidadParaLote < 1) {
                    let gramos = cantidadParaLote * 1000;
                    textoCantidadMostrar = `${gramos.toFixed(0)} g`;
                } else {
                    textoCantidadMostrar = `${cantidadParaLote.toFixed(2)} kg`;
                }
                costoParcial = cantidadParaLote * precioUnitario;
            } else if (ingInfo.unidad === "litro") {
                if (cantidadParaLote < 1) {
                    let mililitros = cantidadParaLote * 1000;
                    textoCantidadMostrar = `${mililitros.toFixed(0)} ml`;
                } else {
                    textoCantidadMostrar = `${cantidadParaLote.toFixed(2)} litros`;
                }
                costoParcial = cantidadParaLote * precioUnitario;
            } else if (ingInfo.unidad === "g") {
                textoCantidadMostrar = `${cantidadParaLote.toFixed(0)} g`;
                costoParcial = (cantidadParaLote / 1000) * precioUnitario;
            } else if (ingInfo.unidad === "ml") {
                textoCantidadMostrar = `${cantidadParaLote.toFixed(0)} ml`;
                costoParcial = (cantidadParaLote / 1000) * precioUnitario;
            } else {
                textoCantidadMostrar = `${cantidadParaLote.toFixed(1)} ${ingInfo.unidad}`;
                costoParcial = cantidadParaLote * precioUnitario;
            }

            costoTotalLote += costoParcial;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${ingInfo.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${textoCantidadMostrar}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${precioUnitario.toFixed(2)} / ${ingInfo.unidad}</td>
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

        if (querySnapshot.empty) {
            tablaHistoricoCuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-400 text-xs">No hay registros históricos todavía.</td></tr>`;
            totalHistoricoSpan.textContent = `Total Acumulado: R$ 0.00`;
            return;
        }

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const costoH = Number(String(data.costoTotal).replace(',', '.')) || 0;
            acumuladoTotal += costoH;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-2 px-3 text-slate-600">${data.fecha}</td>
                <td class="py-2 px-3 font-medium text-slate-800">${data.nombrePlato}</td>
                <td class="py-2 px-3 text-slate-600">${data.comensales}</td>
                <td class="py-2 px-3 text-right font-semibold text-slate-900">R$ ${costoH.toFixed(2)}</td>
                <td class="py-2 px-3 text-right">
                    <button class="btn-eliminar-historico bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-red-200 transition cursor-pointer" 
                        data-id="${id}">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            tablaHistoricoCuerpo.appendChild(tr);
        });

        totalHistoricoSpan.textContent = `Total Acumulado: R$ ${acumuladoTotal.toFixed(2)}`;

        // Activar botones de eliminar en el histórico
        document.querySelectorAll(".btn-eliminar-historico").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const idRegistro = e.currentTarget.dataset.id;
                if (confirm("¿Estás seguro de que deseas eliminar este registro histórico?")) {
                    try {
                        await deleteDoc(doc(db, "produccion_historico", idRegistro));
                        await cargarHistoricoEstadisticas();
                    } catch (err) {
                        console.error("Error al eliminar registro histórico:", err);
                        alert("No se pudo eliminar el registro.");
                    }
                }
            });
        });

    } catch (error) {
        console.error("Error al cargar histórico:", error);
    }
}

if (btnCalcular) btnCalcular.addEventListener("click", calcularCostoReceta);
if (btnRegistrar) btnRegistrar.addEventListener("click", registrarEstadistica);

verificarSesion();
