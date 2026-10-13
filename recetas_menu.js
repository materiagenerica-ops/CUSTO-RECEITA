import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let listaIngredientesGlobal = [];

const formReceta = document.getElementById("form-receta");
const inputNombre = document.getElementById("receta-nombre");
const inputPorciones = document.getElementById("receta-porciones");
const inputImagen = document.getElementById("receta-imagen");
const contenedorIngredientes = document.getElementById("contenedor-ingredientes");
const btnAgregarFila = document.getElementById("btn-agregar-fila");
const mensajeForm = document.getElementById("mensaje-form");

// Cargar ingredientes disponibles desde Firebase para poblar los selectores del formulario
async function cargarIngredientesDisponibles() {
    try {
        const querySnapshot = await getDocs(collection(db, "ingredientes"));
        listaIngredientesGlobal = [];
        querySnapshot.forEach((docSnap) => {
            listaIngredientesGlobal.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Agregar la primera fila por defecto si hay ingredientes
        if (listaIngredientesGlobal.length > 0) {
            agregarFilaIngrediente();
        } else {
            contenedorIngredientes.innerHTML = '<p class="text-xs text-amber-600">Aún no hay insumos cargados. Ve a "Carga de Insumos" primero.</p>';
        }
    } catch (error) {
        console.error("Error al cargar ingredientes:", error);
    }
}

// Añadir fila dinámica de ingrediente + cantidad
function agregarFilaIngrediente() {
    const div = document.createElement("div");
    div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200";
    
    let optionsHtml = listaIngredientesGlobal.map(ing => `<option value="${ing.id}">${ing.nombre} (${ing.unidad})</option>`).join("");

    div.innerHTML = `
        <select class="select-ing flex-grow border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            ${optionsHtml}
        </select>
        <input type="number" step="any" placeholder="Cantidad total" class="input-cant w-32 border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
        <button type="button" class="btn-eliminar text-slate-400 hover:text-red-600 text-sm px-2 py-1 font-bold">✕</button>
    `;

    div.querySelector(".btn-eliminar").addEventListener("click", () => {
        div.remove();
    });

    contenedorIngredientes.appendChild(div);
}

// Convertir archivo de imagen a Base64 para guardarlo directo en Firestore de forma simple
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Guardar Receta en Firebase
async function guardarReceta(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const porciones = parseInt(inputPorciones.value) || 1;

    // Recolectar ingredientes de las filas dinámicas
    const filas = contenedorIngredientes.querySelectorAll("div");
    const ingredientesReceta = [];

    filas.forEach(fila => {
        const select = fila.querySelector(".select-ing");
        const inputCant = fila.querySelector(".input-cant");
        if (select && inputCant) {
            ingredientesReceta.push({
                idIngrediente: select.value,
                cantidad: parseFloat(inputCant.value) || 0
            });
        }
    });

    if (ingredientesReceta.length === 0) {
        alert("Debes agregar al menos un ingrediente a la receta.");
        return;
    }

    try {
        mensajeForm.textContent = "Guardando receta en Firebase...";
        mensajeForm.classList.remove("hidden", "text-red-600");
        mensajeForm.classList.add("text-emerald-600");

        // Procesar imagen si existe
        const imagenBase64 = await convertirImagenABase64(inputImagen.files[0]);

        // ID único amigable para la receta
        const idReceta = nombre.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_");

        await setDoc(doc(db, "recetas", idReceta), {
            nombre,
            porciones,
            imagen: imagenBase64,
            ingredientes: ingredientesReceta
        });

        mensajeForm.textContent = `¡Receta "${nombre}" guardada con éxito!`;
        formReceta.reset();
        contenedorIngredientes.innerHTML = "";
        agregarFilaIngrediente();

        setTimeout(() => {
            mensajeForm.classList.add("hidden");
        }, 4000);

    } catch (error) {
        console.error("Error al guardar la receta:", error);
        mensajeForm.textContent = "Error al grabar en la base de datos.";
        mensajeForm.classList.remove("text-emerald-600");
        mensajeForm.classList.add("text-red-600");
    }
}

btnAgregarFila.addEventListener("click", agregarFilaIngrediente);
formReceta.addEventListener("submit", guardarReceta);
window.addEventListener("DOMContentLoaded", cargarIngredientesDisponibles);
