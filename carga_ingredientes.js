import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const inputIdOculto = document.getElementById("ing-id-oculto");
const inputNombre = document.getElementById("ing-nombre");
const inputUnidad = document.getElementById("ing-unidad");
const inputPrecio = document.getElementById("ing-precio");
const btnGuardarIng = document.getElementById("btn-guardar-ing");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
const mensajeForm = document.getElementById("mensaje-form");
const tablaIngredientesAdmin = document.getElementById("tabla-ingredientes-admin");
const tituloForm = document.getElementById("titulo-form");

async function cargarInsumosAdmin() {
    try {
        const querySnapshot = await getDocs(collection(db, "ingredientes"));
        tablaIngredientesAdmin.innerHTML = "";

        if (querySnapshot.empty) {
            tablaIngredientesAdmin.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-400 text-xs">No hay insumos registrados todavía.</td></tr>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${data.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${data.unidad}</td>
                <td class="py-3 px-3 text-slate-600 font-semibold">R$ ${(Number(String(data.precioUnitario).replace(',', '.')) || 0).toFixed(2)}</td>
                <td class="py-3 px-3 text-right space-x-2">
                    <button class="btn-editar bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 transition cursor-pointer" 
                        data-id="${id}" data-nombre="${data.nombre}" data-unidad="${data.unidad}" data-precio="${data.precioUnitario}">
                        ✏️ Editar
                    </button>
                    <button class="btn-eliminar bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition cursor-pointer" 
                        data-id="${id}">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            tablaIngredientesAdmin.appendChild(tr);
        });

        document.querySelectorAll(".btn-editar").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const dataset = e.currentTarget.dataset;
                prepararEdicion(dataset.id, dataset.nombre, dataset.unidad, dataset.precio);
            });
        });

        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                eliminarInsumo(id);
            });
        });

    } catch (error) {
        console.error("Error al cargar insumos:", error);
    }
}

async function guardarInsumo(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const unidad = inputUnidad.value;
    const precioUnitario = Number(String(inputPrecio.value).replace(',', '.')) || 0;
    const idExistente = inputIdOculto.value;

    const idIngrediente = idExistente ? idExistente : nombre.toLowerCase()
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
        }, { merge: true });

        mensajeForm.textContent = idExistente ? "¡Insumo actualizado con éxito!" : "¡Insumo registrado con éxito!";
        
        limpiarFormulario();
        await cargarInsumosAdmin();

        setTimeout(() => {
            mensajeForm.classList.add("hidden");
        }, 3000);

    } catch (error) {
        console.error("Error al guardar insumo:", error);
        mensajeForm.textContent = "Error al grabar en la base de datos.";
        mensajeForm.classList.remove("text-emerald-600");
        mensajeForm.classList.add("text-red-600");
    }
}

function prepararEdicion(id, nombre, unidad, precio) {
    inputIdOculto.value = id;
    inputNombre.value = nombre;
    inputUnidad.value = unidad;
    inputPrecio.value = precio;

    tituloForm.innerHTML = `<span>✏️</span> Corregir / Editar Insumo`;
    btnGuardarIng.textContent = "Actualizar Insumo";
    btnCancelarEdicion.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
    limpiarFormulario();
}

function limpiarFormulario() {
    formIngrediente.reset();
    inputIdOculto.value = "";
    tituloForm.innerHTML = `<span>📦</span> Registro y Actualización de Insumos`;
    btnGuardarIng.textContent = "Grabar";
    btnCancelarEdicion.classList.add("hidden");
}

async function eliminarInsumo(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este insumo de la base de datos?")) {
        try {
            await deleteDoc(doc(db, "ingredientes", id));
            await cargarInsumosAdmin();
        } catch (error) {
            console.error("Error al eliminar insumo:", error);
            alert("No se pudo eliminar el insumo.");
        }
    }
}

formIngrediente.addEventListener("submit", guardarInsumo);
btnCancelarEdicion.addEventListener("click", cancelarEdicion);
window.addEventListener("DOMContentLoaded", cargarInsumosAdmin);
