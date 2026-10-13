// Importar funciones de Firebase SDK v9+ (Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase provista
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

// Caché de datos
let cacheIngredientes = {};
let cacheRecetas = [];

// Elementos del DOM
const formIngrediente = document.getElementById("form-ingrediente");
const inputNombre = document.getElementById("ing-nombre");
const inputUnidad = document.getElementById("ing-unidad");
const inputPrecio = document.getElementById("ing-precio");
const mensajeForm = document.getElementById("mensaje-form");

const selectReceta = document.getElementById("select-receta");
const btnCalcular = document.getElementById("btn-calcular");
const resultadoContainer = document.getElementById("resultado-container");
const tablaCuerpo = document.getElementById("tabla-ingredientes-cuerpo");
const recetaNombre = document.getElementById("receta-nombre");
const costoTotalSpan = document.getElementById("costo-total");
const mensajeEstado = document.getElementById("mensaje-estado");

// 1. Guardar o actualizar ingrediente en Firebase Firestore
async function guardarIngrediente(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const unidad = inputUnidad.value;
    const precioUnitario = parseFloat(inputPrecio.value);

    // Generar un ID único amigable basado en el nombre (ej: "Pechuga de Pollo" -> "pechuga_de_pollo")
    const idIngrediente = nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_");

    try {
        mensajeForm.textContent = "Guardando en Firebase...";
        mensajeForm.classList.remove("hidden", "text-red-600");
        mensajeForm.classList.add("text-emerald-600");

        // Guardar documento en la colección 'ingredientes'
        await setDoc(doc(db, "ingredientes", idIngrediente), {
            nombre,
            unidad,
            precioUnitario
        });

        mensajeForm.textContent = `¡Ingrediente "${nombre}" guardado con éxito!`;
        formIngrediente.reset();
        
        // Recargar caché local de ingredientes
        await cargarDatosIniciales();

        setTimeout(() => {
            mensajeForm.classList.add("hidden");
        }, 4000);

    } catch (error) {
        console.error("Error al guardar ingrediente:", error);
        mensajeForm.textContent = "Error al guardar en Firebase. Ver consola.";
        mensajeForm.classList.remove("text-emerald-600");
        mensajeForm.classList.add("text-red-600");
    }
}

// 2. Cargar datos desde Firestore (Ingredientes y Recetas)
async function cargarDatosIniciales() {
    try {
        mensajeEstado.textContent = "Sincronizando con base de datos...";
        
        // Cargar Ingredientes
        cacheIngredientes = {};
        const queryIngredientes = await getDocs(collection(db, "ingredientes"));
        queryIngredientes.forEach((docSnap) => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        // Cargar Recetas / Menú Tipo
        const queryRecetas = await getDocs(collection(db, "recetas"));
        cacheRecetas = [];
        selectReceta.innerHTML = '<option value="">-- Seleccione un plato del menú tipo --</option>';
        
        queryRecetas.forEach((docSnap) => {
            const recetaData = { id: docSnap.id, ...docSnap.data() };
            cacheRecetas.push(recetaData);

            const option = document.createElement("option");
            option.value = recetaData.id;
            option.textContent = recetaData.nombre;
            selectReceta.appendChild(option);
        });

        mensajeEstado.textContent = `Base sincronizada (${Object.keys(cacheIngredientes).length} ingredientes cargados).`;
    } catch (error) {
        console.error("Error al cargar datos:", error);
        mensajeEstado.textContent = "Error al conectar con la base de datos.";
    }
}

// 3. Calcular Costo por Porción
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

    if (!recetaSeleccionada.ingredientes || recetaSeleccionada.ingredientes.length === 0) {
        alert("Este plato no tiene ingredientes configurados en la base de datos.");
        return;
    }

    recetaSeleccionada.ingredientes.forEach(item => {
        const infoIngrediente = cacheIngredientes[item.idIngrediente];
        
        if (infoIngrediente) {
            let cantidadPorPorcion = item.cantidad / porcionesRinde;
            // Factor para convertir gramos a kg o ml a litros si la base usa kg/litro
            let divisor = (infoIngrediente.unidad === "kg" || infoIngrediente.unidad === "litro") ? 1000 : 1;
            
            let costoParcial = (cantidadPorPorcion / divisor) * infoIngrediente.precioUnitario;
            costoTotalPorcion += costoParcial;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${infoIngrediente.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${cantidadPorPorcion} ${infoIngrediente.unidad}</td>
                <td class="py-3 px-3 text-slate-600">R$ ${infoIngrediente.precioUnitario.toFixed(2)} / ${infoIngrediente.unidad}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-900">R$ ${costoParcial.toFixed(2)}</td>
            `;
            tablaCuerpo.appendChild(tr);
        } else {
            // Si falta registrar el ingrediente en la base de datos
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-red-500" colspan="3">Falta registrar en base: ID [${item.idIngrediente}]</td>
                <td class="py-3 px-3 text-right text-red-500">R$ 0,00</td>
            `;
            tablaCuerpo.appendChild(tr);
        }
    });

    costoTotalSpan.textContent = `R$ ${costoTotalPorcion.toFixed(2)}`;
    resultadoContainer.classList.remove("hidden");
}

// Event Listeners
formIngrediente.addEventListener("submit", guardarIngrediente);
btnCalcular.addEventListener("click", calcularCostoReceta);
window.addEventListener("DOMContentLoaded", cargarDatosIniciales);
