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
let cacheRecetas = [];

const contenedorSeleccionMenus = document.getElementById("contenedor-seleccion-menus");
const btnAgregarMenu = document.getElementById("btn-agregar-menu");
const btnGenerarLista = document.getElementById("btn-generar-lista");
const resultadoListaContainer = document.getElementById("resultado-lista-container");
const tablaConsolidadaCuerpo = document.getElementById("tabla-consolidada-cuerpo");
const costoGlobalPlanificacion = document.getElementById("costo-global-planificacion");
const mensajeEstado = document.getElementById("mensaje-estado");

async function inicializarListados() {
    try {
        mensajeEstado.textContent = "Cargando datos desde Firebase...";

        // 1. Cargar Insumos
        const qIng = await getDocs(collection(db, "ingredientes"));
        cacheIngredientes = {};
        qIng.forEach(docSnap => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        // 2. Cargar Recetas
        const qRec = await getDocs(collection(db, "recetas"));
        cacheRecetas = [];
        qRec.forEach(docSnap => {
            cacheRecetas.push({ id: docSnap.id, ...docSnap.data() });
        });

        mensajeEstado.textContent = "";

        // Agregar la primera fila de selección por defecto si hay recetas
        if (cacheRecetas.length > 0) {
            agregarFilaMenu();
        } else {
            contenedorSeleccionMenus.innerHTML = '<p class="text-xs text-amber-600">No hay recetas cargadas. Ve a "Menú Tipo" primero.</p>';
            btnAgregarMenu.disabled = true;
            btnGenerarLista.disabled = true;
        }

    } catch (error) {
        console.error("Error al inicializar listados:", error);
        mensajeEstado.textContent = "Error al conectar con la base de datos.";
    }
}

// Agregar fila dinámica para seleccionar plato y cantidad de comensales
function agregarFilaMenu() {
    const div = document.createElement("div");
    div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200";

    let optionsHtml = cacheRecetas.map(rec => `<option value="${rec.id}">${rec.nombre} (Rinde: ${rec.porciones} porciones)</option>`).join("");

    div.innerHTML = `
        <select class="select-receta-plan flex-grow border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            ${optionsHtml}
        </select>
        <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="text-xs text-slate-500">Comensales:</span>
            <input type="number" min="1" value="10" class="input-comensales-plan w-24 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
        </div>
        <button type="button" class="btn-eliminar-fila text-slate-400 hover:text-red-600 text-sm px-2 py-1 font-bold">✕</button>
    `;

    div.querySelector(".btn-eliminar-fila").addEventListener("click", () => {
        div.remove();
    });

    contenedorSeleccionMenus.appendChild(div);
}

// Consolidar cantidades y costos de todos los menús seleccionados
function generarListaConsolidada() {
    const filas = contenedorSeleccionMenus.querySelectorAll("div");
    if (filas.length === 0) {
        alert("Agrega al menos un plato al plan.");
        return;
    }

    // Objeto acumulador para sumar ingredientes repetidos entre diferentes platos
    let insumosAcumulados = {};

    filas.forEach(fila => {
        const select = fila.querySelector(".select-receta-plan");
        const inputComensales = fila.querySelector(".input-comensales-plan");

        if (select && inputComensales) {
            const recetaId = select.value;
            const comensalesDeseados = parseInt(inputComensales.value) || 0;

            const receta = cacheRecetas.find(r => r.id === recetaId);
            if (receta && comensalesDeseados > 0) {
                const porcionesBase = receta.porciones || 1;

                receta.ingredientes.forEach(item => {
                    const ingId = item.idIngrediente;
                    const cantidadPorPlato = item.cantidad / porcionesBase;
                    const cantidadTotalNecesaria = cantidadPorPlato * comensalesDeseados;

                    if (insumosAcumulados[ingId]) {
                        insumosAcumulados[ingId] += cantidadTotalNecesaria;
                    } else {
                        insumosAcumulados[ingId] = cantidadTotalNecesaria;
                    }
                });
            }
        }
    });

    // Renderizar tabla consolidada
    tablaConsolidadaCuerpo.innerHTML = "";
    let costoGlobalTotal = 0;
    let hayInsumos = false;

    for (const [ingId, cantidadTotal] of Object.entries(insumosAcumulados)) {
        const ingInfo = cacheIngredientes[ingId];
        if (ingInfo) {
            hayInsumos = true;
            let divisor = (ingInfo.unidad === "kg" || ingInfo.unidad === "litro") ? 1000 : 1;
            let costoInsumo = (cantidadTotal / divisor) * ingInfo.precioUnitario;
            costoGlobalTotal += costoInsumo;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${ingInfo.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${cantidadTotal.toFixed(1)} ${ingInfo.unidad}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${ingInfo.precioUnitario.toFixed(2)} / ${ingInfo.unidad}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoInsumo.toFixed(2)}</td>
            `;
            tablaConsolidadaCuerpo.appendChild(tr);
        }
    }

    if (!hayInsumos) {
        alert("No se pudieron calcular los ingredientes. Revisa las cantidades.");
        return;
    }

    costoGlobalPlanificacion.textContent = `R$ ${costoGlobalTotal.toFixed(2)}`;
    resultadoListaContainer.classList.remove("hidden");
}

btnAgregarMenu.addEventListener("click", agregarFilaMenu);
btnGenerarLista.addEventListener("click", generarListaConsolidada);
window.addEventListener("DOMContentLoaded", inicializarListados);