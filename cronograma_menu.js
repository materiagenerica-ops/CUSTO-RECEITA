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

let fechaActualVisualizacion = new Date();
let cacheProduccionHistorico = [];
let cacheRecetasFotos = {};

const labelMesAnio = document.getElementById("label-mes-anio");
const calendarioGrid = document.getElementById("calendario-grid");
const btnMesAnterior = document.getElementById("btn-mes-anterior");
const btnMesSiguiente = document.getElementById("btn-mes-siguiente");

const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

async function inicializarCronograma() {
    try {
        // 1. Cargar recetas para obtener sus fotos asociadas por nombre
        const qRecetas = await getDocs(collection(db, "recetas"));
        cacheRecetasFotos = {};
        qRecetas.forEach(docSnap => {
            const data = docSnap.data();
            if (data.nombre && data.imagen) {
                cacheRecetasFotos[data.nombre.toLowerCase().trim()] = data.imagen;
            }
        });

        // 2. Cargar registros históricos (que tienen fecha y plato asignado)
        const qHistorico = await getDocs(collection(db, "produccion_historico"));
        cacheProduccionHistorico = [];
        qHistorico.forEach(docSnap => {
            cacheProduccionHistorico.push(docSnap.data());
        });

        renderizarCalendario();

    } catch (error) {
        console.error("Error al cargar datos del cronograma:", error);
    }
}

function renderizarCalendario() {
    const anio = fechaActualVisualizacion.getFullYear();
    const mes = fechaActualVisualizacion.getMonth();

    labelMesAnio.textContent = `${nombresMeses[mes]} ${anio}`;
    calendarioGrid.innerHTML = "";

    // Primer día del mes y total de días
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate();

    // Rellenar espacios vacíos previos al primer día
    for (let i = 0; i < primerDiaSemana; i++) {
        const casillaVacia = document.createElement("div");
        casillaVacia.className = "bg-slate-50/50 rounded-2xl min-h-28 border border-slate-100 opacity-40";
        calendarioGrid.appendChild(casillaVacia);
    }

    // Rellenar los días del mes
    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(dia).padStart(2, '0');
        const fechaIso = `${anio}-${mesStr}-${diaStr}`; // Formato YYYY-MM-DD igual al guardado en histórico

        const casilla = document.createElement("div");
        casilla.className = "bg-white rounded-2xl p-2 border border-slate-200 min-h-32 flex flex-col justify-between shadow-xs";

        // Número de día
        const numeroDiaHtml = `<div class="text-xs font-bold text-slate-500 mb-1">${dia}</div>`;
        
        // Buscar platos planificados para esta fecha exacta
        const platosDelDia = cacheProduccionHistorico.filter(item => item.fecha === fechaIso);

        let contenidoPlatosHtml = `<div class="space-y-1.5 overflow-y-auto max-h-24">`;
        
        if (platosDelDia.length > 0) {
            platosDelDia.forEach(p => {
                const nombrePlato = p.nombrePlato || "Plato";
                const fotoPlato = cacheRecetasFotos[nombrePlato.toLowerCase().trim()] || "";

                let imgHtml = `<div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs shrink-0 border border-emerald-100">🍽️</div>`;
                if (fotoPlato) {
                    imgHtml = `<img src="${fotoPlato}" alt="${nombrePlato}" class="w-8 h-8 rounded-lg object-cover shrink-0 border border-emerald-200 shadow-xs">`;
                }

                contenidoPlatosHtml += `
                    <div class="flex items-center gap-1.5 bg-emerald-50/80 p-1.5 rounded-xl border border-emerald-100 text-left">
                        ${imgHtml}
                        <div class="overflow-hidden">
                            <p class="text-[11px] font-bold text-emerald-900 truncate leading-tight">${nombrePlato}</p>
                            <p class="text-[9px] text-emerald-700 leading-none">${p.comensales} comensales</p>
                        </div>
                    </div>
                `;
            });
        } else {
            contenidoPlatosHtml += `<span class="text-[10px] text-slate-300 italic block text-center pt-3">Sin menú</span>`;
        }
        contenidoPlatosHtml += `</div>`;

        casilla.innerHTML = numeroDiaHtml + contenidoPlatosHtml;
        calendarioGrid.appendChild(casilla);
    }
}

// Navegación de meses
btnMesAnterior.addEventListener("click", () => {
    fechaActualVisualizacion.setMonth(fechaActualVisualizacion.getMonth() - 1);
    renderizarCalendario();
});

btnMesSiguiente.addEventListener("click", () => {
    fechaActualVisualizacion.setMonth(fechaActualVisualizacion.getMonth() + 1);
    renderizarCalendario();
});

window.addEventListener("DOMContentLoaded", inicializarCronograma);