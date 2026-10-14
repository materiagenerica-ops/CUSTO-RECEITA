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

let cacheIngredientes = {};
let cacheRecetasAdmin = [];

const formReceta = document.getElementById("form-receta");
const inputIdOculto = document.getElementById("receta-id-oculto");
const inputNombre = document.getElementById("receta-nombre");
const inputPorciones = document.getElementById("receta-porciones");
const inputImagen = document.getElementById("receta-imagen");
const contenedorIngredientes = document.getElementById("contenedor-ingredientes");
const btnAgregarFila = document.getElementById("btn-agregar-fila");
const btnGuardarReceta = document.getElementById("btn-guardar-receta");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
const mensajeForm = document.getElementById("mensaje-form");
const tituloFormReceta = document.getElementById("titulo-form-receta");
const tablaRecetasAdmin = document.getElementById("tabla-recetas-admin");

async function inicializarRecetasMenu() {
    try {
        const qIng = await getDocs(collection(db, "ingredientes"));
        cacheIngredientes = {};
        qIng.forEach((docSnap) => {
            cacheIngredientes[docSnap.id] = docSnap.data();
        });

        await cargarRecetasAdmin();

        if (Object.keys(cacheIngredientes).length === 0) {
            contenedorIngredientes.innerHTML = '<p class="text-xs text-amber-600 p-3 bg-amber-50 rounded-xl">No hay insumos cargados. Ve a "Carga de Insumos" primero.</p>';
            if (btnAgregarFila) btnAgregarFila.disabled = true;
        } else {
            if (contenedorIngredientes.children.length === 0) {
                agregarFilaIngrediente();
            }
        }

    } catch (error) {
        console.error("Error al inicializar recetas:", error);
    }
}

async function cargarRecetasAdmin() {
    try {
        const querySnapshot = await getDocs(collection(db, "recetas"));
        tablaRecetasAdmin.innerHTML = "";
        cacheRecetasAdmin = [];

        if (querySnapshot.empty) {
            tablaRecetasAdmin.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-400 text-xs">No hay menús registrados todavía.</td></tr>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            cacheRecetasAdmin.push({ id, ...data });

            let resumenIngredientes = (data.ingredientes || []).map(item => {
                const ing = cacheIngredientes[item.idIngrediente];
                const nombreIng = ing ? ing.nombre : "Insumo";
                let cantidadMostrar = item.cantidad;
                let unidadMostrar = ing ? ing.unidad : "";

                if (ing && (ing.unidad === "kg" || ing.unidad === "kilogramos") && item.cantidad < 1) {
                    cantidadMostrar = (item.cantidad * 1000).toFixed(0);
                    unidadMostrar = "g";
                } else if (ing && (ing.unidad === "litro" || ing.unidad === "litros") && item.cantidad < 1) {
                    cantidadMostrar = (item.cantidad * 1000).toFixed(0);
                    unidadMostrar = "ml";
                }

                return `<span class="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs mr-1 mb-1">${nombreIng}: ${cantidadMostrar} ${unidadMostrar}</span>`;
            }).join("");

            let htmlImagen = `<div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg border border-slate-200">🍽️</div>`;
            if (data.imagen) {
                htmlImagen = `<img src="${data.imagen}" alt="${data.nombre}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs">`;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3">${htmlImagen}</td>
                <td class="py-3 px-3 font-medium text-slate-800">${data.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${data.porciones} porciones</td>
                <td class="py-3 px-3 max-w-xs">${resumenIngredientes}</td>
                <td class="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                    <button type="button" class="btn-editar-receta bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 transition cursor-pointer" 
                        data-id="${id}">
                        ✏️ Editar
                    </button>
                    <button type="button" class="btn-eliminar-receta bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition cursor-pointer" 
                        data-id="${id}">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            tablaRecetasAdmin.appendChild(tr);
        });

        document.querySelectorAll(".btn-editar-receta").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                prepararEdicionReceta(id);
            });
        });

        document.querySelectorAll(".btn-eliminar-receta").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                eliminarReceta(id);
            });
        });

    } catch (error) {
        console.error("Error al cargar listado de recetas:", error);
    }
}

function agregarFilaIngrediente(ingredienteSeleccionado = "", cantidadValor = "") {
    const div = document.createElement("div");
    div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 fila-ingrediente";

    let optionsHtml = '<option value="">-- Seleccione Insumo --</option>';
    for (const [id, data] of Object.entries(cacheIngredientes)) {
        const selected = (id === ingredienteSeleccionado) ? "selected" : "";
        optionsHtml += `<option value="${id}" data-unidad="${data.unidad || 'kg'}" ${selected}>${data.nombre} (${data.unidad || 'kg'})</option>`;
    }

    let valInput = cantidadValor;
    let unidadInicialSeleccionada = "kg";

    if (ingredienteSeleccionado && cacheIngredientes[ingredienteSeleccionado]) {
        const unidadBase = cacheIngredientes[ingredienteSeleccionado].unidad;
        if ((unidadBase === "kg" || unidadBase === "litro") && cantidadValor !== "" && cantidadValor < 1) {
            valInput = (cantidadValor * 1000).toFixed(0);
            unidadInicialSeleccionada = (unidadBase === "kg") ? "g" : "ml";
        } else {
            unidadInicialSeleccionada = unidadBase;
        }
    }

    div.innerHTML = `
        <select class="select-ingrediente flex-grow border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
            ${optionsHtml}
        </select>
        <div class="flex items-center gap-1.5 w-48">
            <input type="number" step="any" min="0.001" value="${valInput}" placeholder="Cant." class="input-cantidad w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
            <select class="select-unidad-receta border border-slate-300 rounded-xl px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">-</option>
            </select>
        </div>
        <button type="button" class="btn-eliminar-fila text-slate-400 hover:text-red-600 text-sm px-2 py-1 font-bold cursor-pointer">✕</button>
    `;

    const selectIng = div.querySelector(".select-ingrediente");
    const selectUnidadReceta = div.querySelector(".select-unidad-receta");

    function actualizarOpcionesUnidad(unidadBase, selecVal = "") {
        selectUnidadReceta.innerHTML = "";
        if (unidadBase === "kg" || unidadBase === "kilogramos") {
            selectUnidadReceta.innerHTML = `
                <option value="kg" ${selecVal === 'kg' || selecVal === 'kilogramos' ? 'selected' : ''}>kg</option>
                <option value="g" ${selecVal === 'g' || selecVal === 'gramos' ? 'selected' : ''}>g (gramos)</option>
            `;
        } else if (unidadBase === "litro" || unidadBase === "litros") {
            selectUnidadReceta.innerHTML = `
                <option value="litro" ${selecVal === 'litro' || selecVal === 'litros' ? 'selected' : ''}>litros</option>
                <option value="ml" ${selecVal === 'ml' || selecVal === 'mililitros' ? 'selected' : ''}>ml (mililitros)</option>
            `;
        } else {
            selectUnidadReceta.innerHTML = `<option value="${unidadBase}">${unidadBase}</option>`;
        }
    }

    selectIng.addEventListener("change", (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const unidadBase = selectedOption.dataset.unidad || "";
        actualizarOpcionesUnidad(unidadBase);
    });

    if (ingredienteSeleccionado) {
        const unidadBase = cacheIngredientes[ingredienteSeleccionado]?.unidad || "kg";
        actualizarOpcionesUnidad(unidadBase, unidadInicialSeleccionada);
    } else {
        selectUnidadReceta.innerHTML = `<option value="">-</option>`;
    }

    div.querySelector(".btn-eliminar-fila").addEventListener("click", () => {
        div.remove();
        if (contenedorIngredientes.children.length === 0) {
            agregarFilaIngrediente();
        }
    });

    contenedorIngredientes.appendChild(div);
}

function prepararEdicionReceta(id) {
    const receta = cacheRecetasAdmin.find(r => r.id === id);
    if (!receta) return;

    inputIdOculto.value = receta.id;
    inputNombre.value = receta.nombre;
    inputPorciones.value = receta.porciones;
    
    contenedorIngredientes.innerHTML = "";
    (receta.ingredientes || []).forEach(item => {
        agregarFilaIngrediente(item.idIngrediente, item.cantidad);
    });

    tituloFormReceta.innerHTML = `<span>✏️</span> Corregir / Editar Menú Tipo`;
    btnGuardarReceta.textContent = "Actualizar Receta";
    btnCancelarEdicion.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicionReceta() {
    formReceta.reset();
    inputIdOculto.value = "";
    contenedorIngredientes.innerHTML = "";
    agregarFilaIngrediente();
    tituloFormReceta.innerHTML = `<span>🍽️</span> Alta de Menú Tipo / Recetas`;
    btnGuardarReceta.textContent = "Grabar Receta en Base";
    btnCancelarEdicion.classList.add("hidden");
}

async function eliminarReceta(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este menú de la base de datos?")) {
        try {
            await deleteDoc(doc(db, "recetas", id));
            await cargarRecetasAdmin();
        } catch (error) {
            console.error("Error al eliminar receta:", error);
            alert("No se pudo eliminar el menú.");
        }
    }
}

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function guardarReceta(e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const porciones = parseInt(inputPorciones.value) || 1;
    const idExistente = inputIdOculto.value;
    
    const filas = contenedorIngredientes.querySelectorAll(".fila-ingrediente");
    let ingredientesReceta = [];

    filas.forEach(fila => {
        const select = fila.querySelector(".select-ingrediente");
        const cantidadInput = fila.querySelector(".input-cantidad");
        const selectUnidad = fila.querySelector(".select-unidad-receta");

        if (select && select.value && cantidadInput && cantidadInput.value) {
            let cantidadIngresada = Number(String(cantidadInput.value).replace(',', '.')) || 0;
            let unidadElegida = selectUnidad ? selectUnidad.value : "";

            let cantidadFinal = cantidadIngresada;
            if (unidadElegida === "g" || unidadElegida === "ml") {
                cantidadFinal = cantidadIngresada / 1000;
            }

            ingredientesReceta.push({
                idIngrediente: select.value,
                cantidad: cantidadFinal
            });
        }
    });

    if (ingredientesReceta.length === 0) {
        alert("Debes agregar al menos un ingrediente válido a la receta.");
        return;
    }

    let imagenBase64 = "";
    const recetaExistente = cacheRecetasAdmin.find(r => r.id === idExistente);

    if (inputImagen && inputImagen.files && inputImagen.files[0]) {
        try {
            imagenBase64 = await convertirImagenABase64(inputImagen.files[0]);
        } catch (err) {
            console.error("Error al procesar imagen:", err);
        }
    } else if (recetaExistente && recetaExistente.imagen) {
        imagenBase64 = recetaExistente.imagen;
    }

    const idReceta = idExistente ? idExistente : nombre.toLowerCase()
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

        mensajeForm.textContent = idExistente ? "¡Menú actualizado con éxito!" : "¡Menú guardado con éxito!";
        cancelarEdicionReceta();
        await cargarRecetasAdmin();

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

if (formReceta) {
    formReceta.addEventListener("submit", guardarReceta);
}

if (btnAgregarFila) {
    btnAgregarFila.addEventListener("click", (e) => {
        e.preventDefault();
        agregarFilaIngrediente();
    });
}

if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener("click", cancelarEdicionReceta);
}

inicializarRecetasMenu();
