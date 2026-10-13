// Importar funciones de Firebase SDK v9+ (Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase provista
const firebaseConfig = {
    apiKey: "AIzaSyCzhFi83TQYmKjZjtHqBZzVRN-GlXyUjvo",
    authDomain: "gastos-culinarios.firebaseapp.com",
    projectId: "gastos-culinarios",
    storageBucket: "gastos-culinarios.firebasestorage.app",
    messagingSenderId: "789890363262",
    appId: "1:789890363262:web:044439da8398e5c0484d2f"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales para almacenar caché de datos locales
let cacheIngredientes = {};
let cacheRecetas = [];

// Elementos del DOM
const selectReceta = document.getElementById("select-receta");
const btnCalcular = document.getElementById("btn-calcular");
const resultadoContainer = document.getElementById("resultado-container");
const tablaCuerpo = document.getElementById("tabla-ingredientes-cuerpo");
const recetaNombre = document.getElementById("receta-nombre");
const costoTotalSpan = document.getElementById("costo-total");
const mensajeEstado = document.getElementById("mensaje-estado");

// Función para cargar datos desde Firestore al iniciar
async function inicializarApp() {
    try {
        mensajeEstado.textContent = "Cargando catálogos desde Firebase...";
        
        // 1. Cargar Ingredientes (Precios en Reales - Torres, RS)
        const queryIngredientes = await getDocs(collection(db, "ingredientes"));
        queryIngredientes.forEach((doc) => {
            cacheIngredientes[doc.id] = doc.data(); 
            // Estructura esperada en documento de ingrediente: 
            // { nombre: "Pechuga de pollo", unidad: "kg", precioUnitario: 22.00 }
        });

        // 2. Cargar Menú Tipo (Recetas)
        const queryRecetas = await getDocs(collection(db, "recetas"));
        cacheRecetas = [];
        selectReceta.innerHTML = '<option value="">-- Seleccione un plato del menú --</option>';
        
        queryRecetas.forEach((doc) => {
            const recetaData = { id: doc.id, ...doc.data() };
            // Estructura esperada en documento de receta:
            // { nombre: "Strogonoff de Frango", porciones: 1, ingredientes: [{ idIngrediente: "...", cantidad: 150 }] }
            cacheRecetas.push(recetaData);

            const option = document.createElement("option");
            option.value = recetaData.id;
            option.textContent = recetaData.nombre;
            selectReceta.appendChild(option);
        });

        mensajeEstado.textContent = "";
    } catch (error) {
        console.error("Error al conectar con Firebase:", error);
        mensajeEstado.textContent = "Error al cargar los datos. Verifica tu conexión o estructura en Firestore.";
        mensajeEstado.classList.add("text-red-500");
    }
}

// Función para calcular costos del plato seleccionado
function calcularCostoReceta() {
    const recetaId = selectReceta.value;
    if (!recetaId) {
        alert("Por favor, seleccione un plato del menú.");
        return;
    }

    const recetaSeleccionada = cacheRecetas.find(r => r.id === recetaId);
    if (!recetaSeleccionada) return;

    recetaNombre.textContent = recetaSeleccionada.nombre;
    tablaCuerpo.innerHTML = "";
    
    let costoTotalPorcion = 0;
    const porcionesRinde = recetaSeleccionada.porciones || 1;

    // Iterar sobre los ingredientes de la receta
    recetaSeleccionada.ingredientes.forEach(item => {
        // Buscamos el ingrediente global en caché por su ID o referencia
        const infoIngrediente = cacheIngredientes[item.idIngrediente];
        
        if (infoIngrediente) {
            // Cálculo del costo parcial: 
            // Si la unidad base es kg o litros, dividimos la cantidad en gramos/ml entre 1000.
            let cantidadPorPorcion = item.cantidad / porcionesRinde;
            let factorConversion = (infoIngrediente.unidad === "kg" || infoIngrediente.unidad === "litro") ? 1000 : 1;
            
            let costoParcial = (cantidadPorPorcion / factorConversion) * infoIngrediente.precioUnitario;
            costoTotalPorcion += costoParcial;

            // Agregar fila a la tabla visual
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${infoIngrediente.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${cantidadPorPorcion} ${infoIngrediente.unidad}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${infoIngrediente.precioUnitario.toFixed(2)} / ${infoIngrediente.unidad}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoParcial.toFixed(2)}</td>
            `;
            tablaCuerpo.appendChild(tr);
        }
    });

    // Mostrar costo total formateado en Reales (BRL)
    costoTotalSpan.textContent = `R$ ${costoTotalPorcion.toFixed(2)}`;
    resultadoContainer.classList.remove("hidden");
}

// Event Listeners
btnCalcular.addEventListener("click", calcularCostoReceta);

// Inicializar al cargar la página
window.addEventListener("DOMContentLoaded", inicializarApp);
