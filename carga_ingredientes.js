import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const formIngrediente = document.getElementById("form-ingrediente");
const inputNombre = document.getElementById("ing-nombre");
const inputUnidad = document.getElementById("ing-unidad");
const inputPrecio = document.getElementById("ing-precio");
const mensajeForm = document.getElementById("mensaje-form");

async function guardarIngrediente(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const unidad = inputUnidad.value;
    const precioUnitario = parseFloat(inputPrecio.value);

    // ID único amigable
    const idIngrediente = nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_");

    try {
        mensajeForm.textContent = "Guardando en Firebase...";
        mensajeForm.classList.remove("hidden", "text-red-600");
        mensajeForm.classList.add("text-emerald-600");

        await setDoc(doc(db, "ingredientes", idIngrediente), {
            nombre,
            unidad,
            precioUnitario
        });

        mensajeForm.textContent = `¡Ingrediente "${nombre}" guardado con éxito!`;
        formIngrediente.reset();

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

formIngrediente.addEventListener("submit", guardarIngrediente);