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

// Función con mapeo altamente específico y completo
function obtenerIconoAlimento(nombre) {
    const n = nombre.toLowerCase().trim();

    // Carnes, embutidos, aves y pescados / conservas
    if (n.includes("pollo") || n.includes("frango") || n.includes("pechuga") || n.includes("suprema")) return "🍗";
    if (n.includes("carne") || n.includes("bovino") || n.includes("asado") || n.includes("costilla") || n.includes("alcatra") || n.includes("patinho") || n.includes("molida") || n.includes("moída")) return "🥩";
    if (n.includes("cerdo") || n.includes("puerco") || n.includes("suino") || n.includes("bondiola") || n.includes("costelinha")) return "🥓";
    if (n.includes("mortadela") || n.includes("mortadella")) return "🥓";
    if (n.includes("jamon") || n.includes("presunto") || n.includes("paleta")) return "🥪";
    if (n.includes("salchicha") || n.includes("salsicha") || n.includes("chorizo") || n.includes("linguiça")) return "🌭";
    if (n.includes("atun") || n.includes("atúm")) return "🥫"; // Lata de atún
    if (n.includes("pescado") || n.includes("peixe") || n.includes("salmón") || n.includes("merluza")) return "🐟";

    // Verduras y Hortalizas específicas
    if (n.includes("morron") || n.includes("pimiento") || n.includes("pimentão") || n.includes("aji")) return "🫑";
    if (n.includes("tomate") || n.includes("salsa") || n.includes("pure de tomate")) return "🍅";
    if (n.includes("cebolla") || n.includes("cebola")) return "🧅";
    if (n.includes("ajo") || n.includes("alho")) return "🧄";
    if (n.includes("papa") || n.includes("patata")) return "🥔";
    if (n.includes("batata") || n.includes("boniato")) return "🍠";
    if (n.includes("zanahoria") || n.includes("cenoura")) return "🥕";
    if (n.includes("lechuga") || n.includes("rucula") || n.includes("espinaca") || n.includes("alface") || n.includes("verde")) return "🥬";
    if (n.includes("brocoli") || n.includes("brócolis") || n.includes("coliflor")) return "🥦";
    if (n.includes("choclo") || n.includes("maiz") || n.includes("milho")) return "🌽";
    if (n.includes("arveja") || n.includes("arvejas") || n.includes("guisante") || n.includes("guisantes") || n.includes("ervilha")) return "🟢";
    if (n.includes("zapallito") || n.includes("zapallitos") || n.includes("abobrinha") || n.includes("zuchini")) return "🥒";
    if (n.includes("palta") || n.includes("aguacate") || n.includes("abacate")) return "🥑";
    if (n.includes("pepino") || n.includes("zapallo") || n.includes("abóbora") || n.includes("calabaza")) return "🥒";

    // Frutas específicas
    if (n.includes("anana") || n.includes("ananá") || n.includes("piña") || n.includes("abacaxi")) return "🍍";
    if (n.includes("mango")) return "🥭";
    if (n.includes("banana") || n.includes("platano")) return "🍌";
    if (n.includes("naranja") || n.includes("laranja")) return "🍊";
    if (n.includes("uva") || n.includes("uvas")) return "🍇";
    if (n.includes("limon") || n.includes("limão")) return "🍋";
    if (n.includes("manzana") || n.includes("maçã")) return "🍎";

    // Lácteos y Huevos
    if (n.includes("queso") || n.includes("mussarela") || n.includes("muzzarella") || n.includes("cheddar") || n.includes("parmesano")) return "🧀";
    if (n.includes("leche") || n.includes("leite")) return "🥛";
    if (n.includes("crema") || n.includes("nata") || n.includes("creme de leite")) return "🍶";
    if (n.includes("mantequilla") || n.includes("manteca") || n.includes("manteiga")) return "🧈";
    if (n.includes("huevo") || n.includes("ovo")) return "🥚";
    if (n.includes("yogur") || n.includes("iogurte")) return "🍧";

    // Harinas, panadería, levaduras y granos
    if (n.includes("arroz")) return "🍚";
    if (n.includes("harina") || n.includes("trigo") || n.includes("farinha")) return "🌾";
    if (n.includes("levadura") || n.includes("fermento")) return "🦠";
    if (n.includes("pan") || n.includes("pão") || n.includes("focaccia") || n.includes("masa")) return "🍞";
    if (n.includes("fideo") || n.includes("pasta") || n.includes("macarron") || n.includes("espagueti") || n.includes("massa")) return "🍝";
    if (n.includes("avena") || n.includes("cereal") || n.includes("granola")) return "🥣";

    // Almacén, condimentos, aceites, vinagres, azúcares y bebidas
    if (n.includes("aceite") || n.includes("óleo") || n.includes("girasol") || n.includes("oliva")) return "🍾";
    if (n.includes("vinagre")) return "🍾";
    if (n.includes("azucar") || n.includes("açúcar") || n.includes("dulce")) return "🛍️"; // Bolsa de azúcar
    if (n.includes("sal")) return "🧂";
    if (n.includes("pimienta") || n.includes("pimenta") || n.includes("comino") || n.includes("organo") || n.includes("oregano") || n.includes("condimento") || n.includes("especi") || n.includes("pimenton")) return "🌿";
    if (n.includes("vino") || n.includes("vinho")) return "🍷";
    if (n.includes("cerveza") || n.includes("cerveja")) return "🍺";
    if (n.includes("cafe") || n.includes("café") || n.includes("te") || n.includes("chá")) return "☕";
    if (n.includes("agua") || n.includes("gaseosa") || n.includes("refresco") || n.includes("suco")) return "🧃";

    return "📦"; // Icono genérico por defecto
}

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
            const icono = obtenerIconoAlimento(data.nombre);
            const precioFmt = (Number(String(data.precioUnitario).replace(',', '.')) || 0).toFixed(2);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-800">${data.nombre}</td>
                <td class="py-3 px-3 text-slate-600">${data.unidad}</td>
                <td class="py-3 px-3 text-slate-600 font-semibold flex items-center gap-1.5">
                    <span>R$ ${precioFmt}</span> <span class="text-base">${icono}</span>
                </td>
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
