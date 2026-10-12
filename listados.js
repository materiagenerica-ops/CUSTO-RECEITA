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

const selectorMenusContainer = document.getElementById("selector-menus-container");
const btnAgregarMenuLista = document.getElementById("btn-agregar-menu-lista");
const btnGenerarConsolidado = document.getElementById("btn-generar-consolidado");
const seccionResultadoConsolidado = document.getElementById("seccion-resultado-consolidado");
const tablaConsolidadoCuerpo = document.getElementById("tabla-consolidado-cuerpo");
const consolidadoCostoTotal = document.getElementById("consolidado-costo-total");

async function inicializarListados() {
    try {
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

        if (cacheRecetas.length === 0) {
            selectorMenusContainer.innerHTML = '<p class="text-xs text-amber-600 p-3 bg-amber-50 rounded-xl">No hay menús registrados. Ve a "Menú Tipo" para crear platos primero.</p>';
            if (btnAgregarMenuLista) btnAgregarMenuLista.disabled = true;
            if (btnGenerarConsolidado) btnGenerarConsolidado.disabled = true;
            return;
        }

        // Agregar fila inicial
        agregarFilaSelectorMenu();

    } catch (error) {
        console.error("Error al inicializar listados:", error);
    }
}

function agregarFilaSelectorMenu() {
    const div = document.createElement("div");
    div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 fila-selector-menu";

    let optionsHtml = '<option value="">-- Seleccionar plato del menú --</option>';
    cacheRecetas.forEach(receta => {
        optionsHtml += `<option value="${receta.id}">${receta.nombre} (Base: ${receta.porciones} porciones)</option>`;
    });

    div.innerHTML = `
        <select class="select-menu-item flex-grow border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
            ${optionsHtml}
        </select>
        <div class="flex items-center gap-2 w-44">
            <span class="text-xs text-slate-500 whitespace-nowrap font-medium">Comensales:</span>
            <input type="number" min="1" value="10" class="input-comensales-menu w-20 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-semibold" required>
        </div>
        <button type="button" class="btn-eliminar-selector text-slate-400 hover:text-red-600 text-sm px-2 py-1 font-bold cursor-pointer">✕</button>
    `;

    div.querySelector(".btn-eliminar-selector").addEventListener("click", () => {
        div.remove();
        if (selectorMenusContainer.children.length === 0) {
            agregarFilaSelectorMenu();
        }
    });

    selectorMenusContainer.appendChild(div);
}

// Cálculo matemático consolidado exacto y blindado
function generarListadoConsolidado() {
    const filas = selectorMenusContainer.querySelectorAll(".fila-selector-menu");
    let acumuladorInsumos = {};
    let costoTotalGeneral = 0;
    let hayPlatosSeleccionados = false;

    filas.forEach(fila => {
        const selectMenu = fila.querySelector(".select-menu-item");
        const inputComensales = fila.querySelector(".input-comensales-menu");

        if (selectMenu && selectMenu.value && inputComensales) {
            const recetaId = selectMenu.value;
            const comensalesDeseados = parseInt(inputComensales.value) || 1;
            const receta = cacheRecetas.find(r => r.id === recetaId);

            if (receta && receta.ingredientes) {
                hayPlatosSeleccionados = true;
                const porcionesBase = parseFloat(receta.porciones) || 1;

                receta.ingredientes.forEach(item => {
                    const ingId = item.idIngrediente;
                    const cantidadBase = Number(String(item.cantidad).replace(',', '.')) || 0;
                    
                    // Cantidad proporcional para los comensales solicitados de este plato
                    const cantidadRequerida = (cantidadBase / porcionesBase) * comensalesDeseados;

                    if (!acumuladorInsumos[ingId]) {
                        acumuladorInsumos[ingId] = 0;
                    }
                    acumuladorInsumos[ingId] += cantidadRequerida;
                });
            }
        }
    });

    if (!hayPlatosSeleccionados) {
        alert("Por favor, selecciona al menos un plato y define la cantidad de comensales.");
        return;
    }

    tablaConsolidadoCuerpo.innerHTML = "";

    // Procesar y sumar costos de cada insumo consolidado
    for (const [ingId, cantidadTotal] of Object.entries(acumuladorInsumos)) {
        const ingInfo = cacheIngredientes[ingId];
        if (ingInfo) {
            const precioUnitario = Number(String(ingInfo.precioUnitario).replace(',', '.')) || 0;
            let costoParcial = 0;
            let textoCantidadFormateada = "";

            // Cálculo estricto según la unidad en la que se compró el insumo
            if (ingInfo.unidad === "kg") {
                costoParcial = cantidadTotal * precioUnitario;
                if (cantidadTotal < 1) {
                    textoCantidadFormateada = `${(cantidadTotal * 1000).toFixed(0)} g`;
                } else {
                    textoCantidadFormateada = `${cantidadTotal.toFixed(2)} kg`;
                }
            } else if (ingInfo.unidad === "litro") {
                costoParcial = cantidadTotal * precioUnitario;
                if (cantidadTotal < 1) {
                    textoCantidadFormateada = `${(cantidadTotal * 1000).toFixed(0)} ml`;
                } else {
                    textoCantidadFormateada = `${cantidadTotal.toFixed(2)} litros`;
                }
            } else if (ingInfo.unidad === "g" || ingInfo.unidad === "ml") {
                costoParcial = (cantidadTotal / 1000) * precioUnitario;
                textoCantidadFormateada = `${cantidadTotal.toFixed(0)} ${ingInfo.unidad}`;
            } else {
                // Unidades discretas (piezas, docenas, atados)
                costoParcial = cantidadTotal * precioUnitario;
                textoCantidadFormateada = `${cantidadTotal.toFixed(1)} ${ingInfo.unidad}`;
            }

            costoTotalGeneral += costoParcial;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${ingInfo.nombre}</td>
                <td class="py-3 px-3 text-slate-600 font-semibold">${textoCantidadFormateada}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${precioUnitario.toFixed(2)} / ${ingInfo.unidad}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoParcial.toFixed(2)}</td>
            `;
            tablaConsolidadoCuerpo.appendChild(tr);
        }
    }

    consolidadoCostoTotal.textContent = `R$ ${costoTotalGeneral.toFixed(2)}`;
    seccionResultadoConsolidado.classList.remove("hidden");
    seccionResultadoConsolidado.scrollIntoView({ behavior: 'smooth' });
}

if (btnAgregarMenuLista) {
    btnAgregarMenuLista.addEventListener("click", (e) => {
        e.preventDefault();
        agregarFilaSelectorMenu();
    });
}

if (btnGenerarConsolidado) {
    btnGenerarConsolidado.addEventListener("click", (e) => {
        e.preventDefault();
        generarListadoConsolidado();
    });
}

window.addEventListener("DOMContentLoaded", inicializarListados);
