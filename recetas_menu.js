import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let ingredientesDisponibles = [];
let ingredientesSeleccionados = [];

const formReceta = document.getElementById("form-receta");
const inputNombre = document.getElementById("receta-nombre");
const inputPorciones = document.getElementById("receta-porciones");
const inputImagen = document.getElementById("receta-imagen");
const selectIngrediente = document.getElementById("select-ingrediente");
const inputCantidadIng = document.getElementById("input-cantidad-ing");
const btnAgregarIng = document.getElementById("btn-agregar-ing");
const tablaIngredientesReceta = document.getElementById("tabla-ingredientes-receta");
const mensajeReceta = document.getElementById("mensaje-receta");
const contenedorTarjetas = document.getElementById("contenedor-tarjetas-recetas");
const inputRecetaId = document.getElementById("receta-id-oculto");
const tituloFormReceta = document.getElementById("titulo-form-receta");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion-receta");

async function inicializarModulo() {
    try {
        await cargarIngredientesSelect();
        await cargarRecetas();
    } catch (error) {
        console.error("Error al inicializar el módulo de menús:", error);
    }
}

async function cargarIngredientesSelect() {
    try {
        const querySnapshot = await getDocs(collection(db, "ingredientes"));
        ingredientesDisponibles = [];
        if (selectIngrediente) {
            selectIngrediente.innerHTML = '<option value="">-- Seleccione un insumo --</option>';

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const item = { id: docSnap.id, ...data };
                ingredientesDisponibles.push(item);

                const opt = document.createElement("option");
                opt.value = item.id;
                opt.textContent = `${item.nombre} (${item.unidad})`;
                selectIngrediente.appendChild(opt);
            });
        }
    } catch (error) {
        console.error("Error al cargar ingredientes para select:", error);
    }
}

if (btnAgregarIng) {
    btnAgregarIng.addEventListener("click", (e) => {
        e.preventDefault(); // Evita cualquier comportamiento de formulario por defecto
        
        const idIngrediente = selectIngrediente.value;
        const cantidadStr = inputCantidadIng.value.trim().replace(',', '.');
        const cantidad = Number(cantidadStr);

        if (!idIngrediente) {
            alert("Por favor, seleccione un ingrediente.");
            return;
        }
        if (isNaN(cantidad) || cantidad <= 0) {
            alert("Por favor, ingrese una cantidad válida mayor a 0.");
            return;
        }

        const ingInfo = ingredientesDisponibles.find(i => i.id === idIngrediente);
        if (!ingInfo) {
            alert("No se encontró la información del ingrediente seleccionado.");
            return;
        }

        // Verificar si ya fue agregado para actualizar o sumar
        const existente = ingredientesSeleccionados.find(i => i.idIngrediente === idIngrediente);
        if (existente) {
            existente.cantidad = cantidad;
        } else {
            ingredientesSeleccionados.push({
                idIngrediente,
                nombre: ingInfo.nombre,
                unidad: ingInfo.unidad,
                cantidad
            });
        }

        inputCantidadIng.value = "";
        selectIngrediente.value = "";
        renderizarTablaIngredientesReceta();
    });
}

function renderizarTablaIngredientesReceta() {
    if (!tablaIngredientesReceta) return;
    tablaIngredientesReceta.innerHTML = "";
    
    if (ingredientesSeleccionados.length === 0) {
        tablaIngredientesReceta.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-slate-400 text-xs">No hay ingredientes agregados a este plato.</td></tr>`;
        return;
    }

    ingredientesSeleccionados.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="py-2.5 px-3 font-medium text-slate-800">${item.nombre}</td>
            <td class="py-2.5 px-3 text-slate-600">${item.cantidad} ${item.unidad}</td>
            <td class="py-2.5 px-3 text-right">
                <button type="button" class="btn-quitar-ing text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 bg-red-50 rounded-lg border border-red-200 cursor-pointer" data-index="${index}">
                    🗑️ Quitar
                </button>
            </td>
        `;
        tablaIngredientesReceta.appendChild(tr);
    });

    document.querySelectorAll(".btn-quitar-ing").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            ingredientesSeleccionados.splice(idx, 1);
            renderizarTablaIngredientesReceta();
        });
    });
}

async function guardarReceta(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const porciones = parseInt(inputPorciones.value) || 1;
    const imagen = inputImagen.value.trim();
    const idExistente = inputRecetaId.value;

    if (!nombre) {
        alert("El nombre del plato es obligatorio.");
        return;
    }

    if (ingredientesSeleccionados.length === 0) {
        alert("Debe agregar al menos un ingrediente a la receta.");
        return;
    }

    const idReceta = idExistente ? idExistente : nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_");

    try {
        mensajeReceta.textContent = "Guardando menú en la base de datos...";
        mensajeReceta.classList.remove("hidden", "text-red-600");
        mensajeReceta.classList.add("text-emerald-600");

        const datosPlato = {
            nombre,
            porciones,
            imagen,
            ingredientes: ingredientesSeleccionados.map(i => ({
                idIngrediente: i.idIngrediente,
                cantidad: i.cantidad
            }))
        };

        await setDoc(doc(db, "recetas", idReceta), datosPlato, { merge: true });

        mensajeReceta.textContent = "¡Menú guardado con éxito en Firebase!";
        limpiarFormularioReceta();
        await cargarRecetas();

        setTimeout(() => {
            mensajeReceta.classList.add("hidden");
        }, 3500);

    } catch (error) {
        console.error("Error crítico al guardar receta:", error);
        mensajeReceta.textContent = "Error al guardar en Firebase: " + error.message;
        mensajeReceta.classList.remove("text-emerald-600");
        mensajeReceta.classList.add("text-red-600");
    }
}

async function cargarRecetas() {
    try {
        const querySnapshot = await getDocs(collection(db, "recetas"));
        if (!contenedorTarjetas) return;
        contenedorTarjetas.innerHTML = "";

        if (querySnapshot.empty) {
            contenedorTarjetas.innerHTML = `<p class="text-xs text-slate-400 text-center col-span-full py-4">No hay menús registrados todavía.</p>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const tarjeta = document.createElement("div");
            tarjeta.className = "bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between space-y-4";
            
            let htmlImagen = data.imagen ? `<img src="${data.imagen}" alt="${data.nombre}" class="w-full h-36 object-cover rounded-xl mb-3 border border-slate-100">` : '';

            let listaHtml = '<ul class="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">';
            if (data.ingredientes) {
                data.ingredientes.forEach(ing => {
                    const infoIng = ingredientesDisponibles.find(i => i.id === ing.idIngrediente);
                    const nombreIng = infoIng ? infoIng.nombre : ing.idIngrediente;
                    const unidadIng = infoIng ? infoIng.unidad : '';
                    listaHtml += `<li>• ${nombreIng}: <strong>${ing.cantidad} ${unidadIng}</strong></li>`;
                });
            }
            listaHtml += '</ul>';

            tarjeta.innerHTML = `
                <div>
                    ${htmlImagen}
                    <h3 class="font-bold text-slate-900 text-base">${data.nombre}</h3>
                    <p class="text-xs text-slate-500 mb-3">Rendimiento base: <strong class="text-slate-700">${data.porciones} porciones</strong></p>
                    ${listaHtml}
                </div>
                <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button class="btn-editar-receta bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer" 
                        data-id="${id}" data-nombre="${data.nombre}" data-porciones="${data.porciones}" data-imagen="${data.imagen || ''}">
                        ✏️ Editar
                    </button>
                    <button class="btn-eliminar-receta bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-200 transition cursor-pointer" 
                        data-id="${id}">
                        🗑️ Eliminar
                    </button>
                </div>
            `;
            contenedorTarjetas.appendChild(tarjeta);
        });

        document.querySelectorAll(".btn-eliminar-receta").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("¿Estás seguro de que deseas eliminar este menú?")) {
                    try {
                        await deleteDoc(doc(db, "recetas", id));
                        await cargarRecetas();
                    } catch (err) {
                        console.error("Error al eliminar receta:", err);
                        alert("No se pudo eliminar el menú.");
                    }
                }
            });
        });

        document.querySelectorAll(".btn-editar-receta").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const ds = e.currentTarget.dataset;
                prepararEdicionReceta(ds.id, ds.nombre, ds.porciones, ds.imagen);
            });
        });

    } catch (error) {
        console.error("Error al cargar recetas:", error);
    }
}

async function prepararEdicionReceta(id, nombre, porciones, imagen) {
    inputRecetaId.value = id;
    inputNombre.value = nombre;
    inputPorciones.value = porciones;
    inputImagen.value = imagen || "";

    const snapshot = await getDocs(collection(db, "recetas"));
    snapshot.forEach(docSnap => {
        if (docSnap.id === id) {
            const data = docSnap.data();
            ingredientesSeleccionados = [];
            if (data.ingredientes) {
                data.ingredientes.forEach(ing => {
                    const infoIng = ingredientesDisponibles.find(i => i.id === ing.idIngrediente);
                    ingredientesSeleccionados.push({
                        idIngrediente: ing.idIngrediente,
                        nombre: infoIng ? infoIng.nombre : ing.idIngrediente,
                        unidad: infoIng ? infoIng.unidad : '',
                        cantidad: ing.cantidad
                    });
                });
            }
            renderizarTablaIngredientesReceta();
        }
    });

    tituloFormReceta.innerHTML = `<span>✏️</span> Modificar Menú Tipo`;
    document.getElementById("btn-guardar-receta").textContent = "Actualizar Menú";
    btnCancelarEdicion.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener("click", () => {
        limpiarFormularioReceta();
    });
}

function limpiarFormularioReceta() {
    if (formReceta) formReceta.reset();
    inputRecetaId.value = "";
    ingredientesSeleccionados = [];
    renderizarTablaIngredientesReceta();
    tituloFormReceta.innerHTML = `<span>🍽️</span> Creación de Menú Tipo (Plato)`;
    document.getElementById("btn-guardar-receta").textContent = "Grabar Menú";
    btnCancelarEdicion.classList.add("hidden");
}

if (formReceta) {
    formReceta.addEventListener("submit", guardarReceta);
}

window.addEventListener("DOMContentLoaded", inicializarModulo);
