import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let cacheIngredientes = {};
let cacheRecetas = {};

const selectReceta = document.getElementById("select-receta");
const btnCalcular = document.getElementById("btn-calcular");
const resultadoContainer = document.getElementById("resultado-container");
const mensajeEstado = document.getElementById("mensaje-estado");
const tablaCuerpo = document.getElementById("tabla-ingredientes-cuerpo");
const labelNombre = document.getElementById("receta-nombre");
const costoTotalSpan = document.getElementById("costo-total");

async function inicializarApp() {
    try {
        mensajeEstado.textContent = "Cargando datos desde Firebase...";

        // 1. Cargar insumos
        const snapIng = await getDocs(collection(db, "ingredientes"));
        cacheIngredientes = {};
        snapIng.forEach(docSnap => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        // 2. Cargar recetas (menús tipo)
        const snapRecetas = await getDocs(collection(db, "recetas"));
        cacheRecetas = {};
        selectReceta.innerHTML = '<option value="">-- Seleccione un plato del menú --</option>';

        let totalRecetas = 0;
        snapRecetas.forEach(docSnap => {
            const data = docSnap.data();
            cacheRecetas[docSnap.id] = data;
            totalRecetas++;

            const opt = document.createElement("option");
            opt.value = docSnap.id;
            opt.textContent = data.nombre || docSnap.id;
            selectReceta.appendChild(opt);
        });

        if (totalRecetas > 0) {
            mensajeEstado.textContent = "";
            mensajeEstado.classList.add("hidden");
        } else {
            mensajeEstado.textContent = "No se encontraron menús tipo registrados en Firestore.";
        }

    } catch (error) {
        console.error("Error al inicializar:", error);
        mensajeEstado.textContent = "Error al conectar con la base de datos.";
    }
}

function calcularCostoPlato() {
    const recetaId = selectReceta.value;
    if (!recetaId || !cacheRecetas[recetaId]) {
        resultadoContainer.classList.add("hidden");
        return;
    }

    const receta = cacheRecetas[recetaId];
    labelNombre.textContent = receta.nombre || "Plato sin nombre";
    tablaCuerpo.innerHTML = "";

    let costoTotalLote = 0;
    const ingredientesReceta = receta.ingredientes || [];

    if (ingredientesReceta.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-400">Este menú no tiene ingredientes cargados.</td></tr>`;
        costoTotalSpan.textContent = "R$ 0,00";
        resultadoContainer.classList.remove("hidden");
        return;
    }

    ingredientesReceta.forEach(ing => {
        const idInsumo = ing.idIngrediente;
        const infoInsumo = cacheIngredientes[idInsumo] || {};
        
        const nombreInsumo = infoInsumo.nombre || idInsumo;
        const precioBase = Number(infoInsumo.precio) || 0;
        const unidadBase = (infoInsumo.unidad || 'kg').toLowerCase().trim();
        
        const cantidadReceta = Number(ing.cantidad) || 0;
        // Asumimos unidad de receta (si no está especificada explícitamente, tomamos la base del insumo)
        const unidadReceta = (ing.unidad || unidadBase).toLowerCase().trim();

        // CONVERSIÓN MATEMÁTICA DE UNIDADES (Evita el error de calcular gramos como kilogramos)
        let cantidadNormalizada = cantidadReceta;
        if ((unidadBase === 'kg' || unidadBase === 'kilogramos') && (unidadReceta === 'g' || unidadReceta === 'gramos')) {
            cantidadNormalizada = cantidadReceta / 1000;
        } else if ((unidadBase === 'l' || unidadBase === 'litros') && (unidadReceta === 'ml' || unidadReceta === 'mililitros')) {
            cantidadNormalizada = cantidadReceta / 1000;
        }

        const costoParcial = cantidadNormalizada * precioBase;
        costoTotalLote += costoParcial;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="py-3 px-3 font-medium text-slate-800">${nombreInsumo}</td>
            <td class="py-3 px-3 text-slate-600">${cantidadReceta} ${unidadReceta}</td>
            <td class="py-3 px-3 text-slate-500">R$ ${precioBase.toFixed(2)} / ${unidadBase}</td>
            <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoParcial.toFixed(2)}</td>
        `;
        tablaCuerpo.appendChild(tr);
    });

    costoTotalSpan.textContent = `R$ ${costoTotalLote.toFixed(2)}`;
    resultadoContainer.classList.remove("hidden");
}

if (btnCalcular) {
    btnCalcular.addEventListener("click", calcularCostoPlato);
}

if (selectReceta) {
    selectReceta.addEventListener("change", calcularCostoPlato);
}

inicializarApp();
