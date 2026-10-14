import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let cacheHistorialListados = [];

const selectorMenusContainer = document.getElementById("selector-menus-container");
const btnAgregarMenuLista = document.getElementById("btn-agregar-menu-lista");
const btnGenerarConsolidado = document.getElementById("btn-generar-consolidado");
const seccionResultadoConsolidado = document.getElementById("seccion-resultado-consolidado");
const tablaConsolidadoCuerpo = document.getElementById("tabla-consolidado-cuerpo");
const consolidadoCostoTotal = document.getElementById("consolidado-costo-total");
const historialListadosContainer = document.getElementById("historial-listados-container");

async function inicializarListados() {
    try {
        const qIng = await getDocs(collection(db, "ingredientes"));
        cacheIngredientes = {};
        qIng.forEach(docSnap => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        const qRec = await getDocs(collection(db, "recetas"));
        cacheRecetas = [];
        qRec.forEach(docSnap => {
            cacheRecetas.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Incluso si hay o no recetas, aseguramos que el contenedor se limpie y permita agregar filas
        if (selectorMenusContainer) {
            selectorMenusContainer.innerHTML = "";
        }

        agregarFilaSelectorMenu();
        await cargarHistorialListados();

    } catch (error) {
        console.error("Error al inicializar listados:", error);
        if (selectorMenusContainer && selectorMenusContainer.children.length === 0) {
            agregarFilaSelectorMenu();
        }
    }
}

async function cargarHistorialListados() {
    if (!historialListadosContainer) return;
    try {
        const querySnapshot = await getDocs(collection(db, "listados_historico"));
        historialListadosContainer.innerHTML = "";
        cacheHistorialListados = [];

        if (querySnapshot.empty) {
            historialListadosContainer.innerHTML = '<p class="text-xs text-slate-400">No hay listados guardados en el historial.</p>';
            return;
        }

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            cacheHistorialListados.push({ id: docSnap.id, ...data });
        });

        cacheHistorialListados.sort((a, b) => new Date(b.fechaISO || 0) - new Date(a.fechaISO || 0));

        cacheHistorialListados.forEach(item => {
            const div = document.createElement("div");
            div.className = "flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs";
            div.innerHTML = `
                <div>
                    <span class="font-bold text-slate-800 block">📅 ${item.fechaStr || 'Fecha no registrada'}</span>
                    <span class="text-slate-500">Total ítems: ${item.totalInsumos || 0} - Costo: <strong class="text-emerald-700">R$ ${Number(item.costoTotal || 0).toFixed(2)}</strong></span>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" class="btn-ver-historial bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer" data-id="${item.id}">
                        👁️ Ver
                    </button>
                    <button type="button" class="btn-eliminar-historial bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition cursor-pointer" data-id="${item.id}">
                        🗑️ Eliminar
                    </button>
                </div>
            `;
            historialListadosContainer.appendChild(div);
        });

        document.querySelectorAll(".btn-ver-historial").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                mostrarListadoHistorial(id);
            });
        });

        document.querySelectorAll(".btn-eliminar-historial").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                eliminarListadoHistorial(id);
            });
        });

    } catch (error) {
        console.error("Error al cargar historial de listados:", error);
        historialListadosContainer.innerHTML = '<p class="text-xs text-red-400">Error al cargar el historial.</p>';
    }
}

function agregarFilaSelectorMenu(menuIdSeleccionado = "", comensalesValor = 10) {
    if (!selectorMenusContainer) return;

    const div = document.createElement("div");
    div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 fila-selector-menu";

    let optionsHtml = '<option value="">-- Seleccionar plato del menú --</option>';
    if (cacheRecetas && cacheRecetas.length > 0) {
        cacheRecetas.forEach(receta => {
            const selected = (receta.id === menuIdSeleccionado) ? "selected" : "";
            optionsHtml += `<option value="${receta.id}" ${selected}>${receta.nombre || receta.id} (Base: ${receta.porciones || 1} porciones)</option>`;
        });
    }

    div.innerHTML = `
        <select class="select-menu-item flex-grow border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
            ${optionsHtml}
        </select>
        <div class="flex items-center gap-2 w-44">
            <span class="text-xs text-slate-500 whitespace-nowrap font-medium">Comensales:</span>
            <input type="number" min="1" value="${comensalesValor}" class="input-comensales-menu w-20 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-semibold" required>
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

async function generarListadoConsolidado() {
    if (!selectorMenusContainer) return;
    const filas = selectorMenusContainer.querySelectorAll(".fila-selector-menu");
    let acumuladorInsumos = {};
    let costoTotalGeneral = 0;
    let hayPlatosSeleccionados = false;
    let detallePlatosSeleccionados = [];

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

                detallePlatosSeleccionados.push({
                    recetaId: receta.id,
                    nombre: receta.nombre,
                    comensales: comensalesDeseados
                });

                receta.ingredientes.forEach(item => {
                    const ingId = item.idIngrediente;
                    const cantidadBase = Number(String(item.cantidad).replace(',', '.')) || 0;
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

    if (tablaConsolidadoCuerpo) tablaConsolidadoCuerpo.innerHTML = "";
    let listaInsumosGuardar = [];

    for (const [ingId, cantidadTotal] of Object.entries(acumuladorInsumos)) {
        const ingInfo = cacheIngredientes[ingId] || { nombre: ingId, precio: 0, unidad: 'kg' };
        const precioUnitario = Number(String(ingInfo.precio || ingInfo.precioUnitario || 0).replace(',', '.')) || 0;
        let costoParcial = 0;
        let textoCantidadFormateada = "";

        const unidadInsumo = (ingInfo.unidad || 'kg').toLowerCase().trim();

        if (unidadInsumo === "kg" || unidadInsumo === "kilogramos") {
            costoParcial = cantidadTotal * precioUnitario;
            if (cantidadTotal < 1) {
                textoCantidadFormateada = `${(cantidadTotal * 1000).toFixed(0)} g`;
            } else {
                textoCantidadFormateada = `${cantidadTotal.toFixed(2)} kg`;
            }
        } else if (unidadInsumo === "litro" || unidadInsumo === "litros") {
            costoParcial = cantidadTotal * precioUnitario;
            if (cantidadTotal < 1) {
                textoCantidadFormateada = `${(cantidadTotal * 1000).toFixed(0)} ml`;
            } else {
                textoCantidadFormateada = `${cantidadTotal.toFixed(2)} litros`;
            }
        } else if (unidadInsumo === "g" || unidadInsumo === "ml") {
            costoParcial = (cantidadTotal / 1000) * precioUnitario;
            textoCantidadFormateada = `${cantidadTotal.toFixed(0)} ${unidadInsumo}`;
        } else {
            costoParcial = cantidadTotal * precioUnitario;
            textoCantidadFormateada = `${cantidadTotal.toFixed(1)} ${unidadInsumo}`;
        }

        costoTotalGeneral += costoParcial;

        listaInsumosGuardar.push({
            nombreIngrediente: ingInfo.nombre || ingId,
            cantidadTexto: textoCantidadFormateada,
            costoParcial: costoParcial
        });

        if (tablaConsolidadoCuerpo) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${ingInfo.nombre || ingId}</td>
                <td class="py-3 px-3 text-slate-600 font-semibold">${textoCantidadFormateada}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${precioUnitario.toFixed(2)} / ${unidadInsumo}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoParcial.toFixed(2)}</td>
            `;
            tablaConsolidadoCuerpo.appendChild(tr);
        }
    }

    if (consolidadoCostoTotal) consolidadoCostoTotal.textContent = `R$ ${costoTotalGeneral.toFixed(2)}`;
    if (seccionResultadoConsolidado) {
        seccionResultadoConsolidado.classList.remove("hidden");
        seccionResultadoConsolidado.scrollIntoView({ behavior: 'smooth' });
    }

    try {
        const ahora = new Date();
        const fechaStr = ahora.toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        await addDoc(collection(db, "listados_historico"), {
            fechaISO: ahora.toISOString(),
            fechaStr: fechaStr,
            platos: detallePlatosSeleccionados,
            insumos: listaInsumosGuardar,
            totalInsumos: listaInsumosGuardar.length,
            costoTotal: costoTotalGeneral
        });

        await cargarHistorialListados();
    } catch (error) {
        console.error("Error al guardar listado en Firestore:", error);
    }
}

function mostrarListadoHistorial(id) {
    const item = cacheHistorialListados.find(h => h.id === id);
    if (!item) return;

    if (selectorMenusContainer) selectorMenusContainer.innerHTML = "";
    if (item.platos && item.platos.length > 0) {
        item.platos.forEach(p => {
            agregarFilaSelectorMenu(p.recetaId, p.comensales);
        });
    } else {
        agregarFilaSelectorMenu();
    }

    if (tablaConsolidadoCuerpo) tablaConsolidadoCuerpo.innerHTML = "";
    if (item.insumos && item.insumos.length > 0) {
        item.insumos.forEach(ins => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${ins.nombreIngrediente}</td>
                <td class="py-3 px-3 text-slate-600 font-semibold">${ins.cantidadTexto}</td>
                <td class="py-3 px-3 text-slate-600">-</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${Number(ins.costoParcial || 0).toFixed(2)}</td>
            `;
            tablaConsolidadoCuerpo.appendChild(tr);
        });
    }

    if (consolidadoCostoTotal) consolidadoCostoTotal.textContent = `R$ ${Number(item.costoTotal || 0).toFixed(2)}`;
    if (seccionResultadoConsolidado) {
        seccionResultadoConsolidado.classList.remove("hidden");
        seccionResultadoConsolidado.scrollIntoView({ behavior: 'smooth' });
    }
}

async function eliminarListadoHistorial(id) {
    if (confirm("¿Estás seguro de eliminar este listado del historial?")) {
        try {
            await deleteDoc(doc(db, "listados_historico", id));
            await cargarHistorialListados();
        } catch (error) {
            console.error("Error al eliminar listado:", error);
            alert("No se pudo eliminar el registro.");
        }
    }
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
