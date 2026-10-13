import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const formReceta = document.getElementById("form-receta");
const inputNombre = document.getElementById("receta-nombre");
const inputPorciones = document.getElementById("receta-porciones");
const inputImagen = document.getElementById("receta-imagen");
const contenedorIngredientes = document.getElementById("contenedor-ingredientes");
const btnAgregarFila = document.getElementById("btn-agregar-fila");
const mensajeForm = document.getElementById("mensaje-form");

// Cargar ingredientes desde Firebase para armar las opciones
async function inicializarRecetasMenu() {
    try {
        const querySnapshot = await getDocs(collection(db, "ingredientes"));
        cacheIngredientes = {};
        
        querySnapshot.forEach((docSnap) => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        if (Object.keys(cacheIngredientes).length === 0) {
            contenedorIngredientes.innerHTML = '<p class="text-xs text-amber-600">No hay insumos cargados. Ve a "Carga de Insumos" primero.</p>';
            btnAgregarFila.disabled = true;
        } else {
            agregarFilaIngrediente();
        }

    } catch (error) {
        console.error("Error al cargar ingredientes:", error);
    }
}

// Agregar fila de ingrediente con indicador automático de su unidad
function agregarFilaIngrediente() {
    const div = document.createElement("div");
    div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200";

    let optionsHtml = '<option value="">-- Seleccione Insumo --</option>';
    for (const [id, data] of Object.entries(cacheIngredientes)) {
        optionsHtml += `<option value="${id}" data-unidad="${data.unidad}">${data.nombre} (${data.unidad})</option>`;
    }

    div.innerHTML = `
        <select class="select-ingrediente flex-grow border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
            ${optionsHtml}
        </select>
        <div class="flex items-center gap-1.5 w-40">
            <input type="number" step="any" min="0.001" placeholder="Cant." class="input-cantidad w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
            <span class="span-unidad text-xs font-bold text-slate-500 w-16 whitespace-nowrap">-</span>
        </div>
        <button type="button" class="btn-eliminar-fila text-slate-400 hover:text-red-600 text-sm px-2 py-1 font-bold cursor-pointer">✕</button>
    `;

    const selectIng = div.querySelector(".select-ingrediente");
    const spanUnidad = div.querySelector(".span-unidad");

    // Al cambiar el ingrediente, actualizar dinámicamente la etiqueta de la unidad
    selectIng.addEventListener("change", (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const unidad = selectedOption.dataset.unidad || "-";
        spanUnidad.textContent = unidad;
    });

    div.querySelector(".btn-eliminar-fila").addEventListener("click", () => {
        div.remove();
    });

    contenedorIngredientes.appendChild(div);
}

// Convertir imagen seleccionada a Base64
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Guardar receta en Firebase
async function guardarReceta(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const porciones = parseInt(inputPorciones.value) || 1;
    
    const filas = contenedorIngredientes.querySelectorAll("div.flex");
    let ingredientesReceta = [];

    filas.forEach(fila => {
        const select = fila.querySelector(".select-ingrediente");
        const cantidadInput = fila.querySelector(".input-cantidad");

        if (select.value && cantidadInput.value) {
            ingredientesReceta.push({
                idIngrediente: select.value,
                cantidad: parseFloat(cantidadInput.value)
            });
        }
    });

    if (ingredientesReceta.length === 0) {
        alert("Debes agregar al menos un ingrediente a la receta.");
        return;
    }

    let imagenBase64 = "";
    if (inputImagen.files && inputImagen.files[0]) {
        try {
            imagenBase64 = await convertirImagenABase64(inputImagen.files[0]);
        } catch (err) {
            console.error("Error al procesar imagen:", err);
        }
    }

    const idReceta = nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_");

    try {
        mensajeForm.textContent = "Guardando receta en Firebase...";
        mensajeForm.classList.remove("hidden", "text-red-600");
        mensajeForm.classList.add("text-emerald-600");

        const datosReceta = {
            nombre,
            porciones,
            ingredientes: ingredientesReceta
        };

        if (imagenBase64) {
            datosReceta.imagen = imagenBase64;
        }

        await setDoc(doc(db, "recetas", idReceta), datosReceta, { merge: true });

        mensajeForm.textContent = "¡Menú / Receta guardada con éxito!";
        formReceta.reset();
        contenedorIngredientes.innerHTML = "";
        agregarFilaIngrediente();

        setTimeout(() => {
            mensajeForm.classList.add("hidden");
        }, 4000);

    } catch (error) {
        console.error("Error al guardar receta:", error);
        mensajeForm.textContent = "Error al guardar la receta en la base de datos.";
        mensajeForm.classList.remove("text-emerald-600");
        mensajeForm.classList.add("text-red-600");
    }
}

btnAgregarFila.addEventListener("click", agregarFilaIngrediente);
formReceta.addEventListener("submit", guardarReceta);
window.addEventListener("DOMContentLoaded", inicializarRecetasMenu);
