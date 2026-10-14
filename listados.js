<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custo Receita - Listado Consolidado de Compras</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between print:bg-white">

    <div class="print:hidden">
        <!-- Encabezado con Logotipo -->
        <header class="bg-white shadow-sm border-b border-slate-200 py-4 px-6 flex items-center justify-center">
            <div class="flex items-center space-x-3">
                <img src="logotipoc.jpg" alt="Custo Receita Logo" class="h-12 w-auto object-contain">
                <div>
                    <h1 class="text-xl font-bold text-slate-900 leading-tight">Custo Receita</h1>
                    <p class="text-xs text-slate-500">Calculadora de Costos - Torres, RS (Brasil)</p>
                </div>
            </div>
        </header>

        <!-- Barra de Menú Horizontal -->
        <nav class="bg-white border-b border-slate-200 shadow-xs px-6 py-3">
            <div class="max-w-6xl mx-auto flex items-center space-x-3 overflow-x-auto">
                <a href="index.html" class="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 transition">
                    <span>🏠</span> <span>Calculadora</span>
                </a>
                <a href="carga_ingredientes.html" class="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 transition">
                    <span>📦</span> <span>Carga de Insumos</span>
                </a>
                <a href="recetas_menu.html" class="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 transition">
                    <span>🍽️</span> <span>Menú Tipo</span>
                </a>
                <a href="listados.html" class="flex items-center space-x-2 text-xs font-semibold text-white bg-emerald-600 px-4 py-2.5 rounded-xl shadow-sm transition">
                    <span>📋</span> <span>Listado de Alimentos</span>
                </a>
                <a href="cronograma_menu.html" class="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 transition">
                    <span>📅</span> <span>Cronograma Menú</span>
                </a>
            </div>
        </nav>
    </div>

    <!-- Contenido Principal -->
    <main class="max-w-4xl mx-auto px-4 py-8 w-full flex-grow space-y-6">
        
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-none print:p-0">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <span>📋</span> Planificador Consolidado de Compras
                    </h2>
                    <p class="text-xs text-slate-500">Selecciona los platos y la cantidad de comensales para cada uno para generar la lista exacta de ingredientes necesarios y sus costos.</p>
                </div>
                <button onclick="window.print()" class="print:hidden bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-2">
                    <span>🖨️</span> Imprimir / Guardar PDF
                </button>
            </div>

            <div id="selector-menus-container" class="space-y-3 print:hidden mb-6">
                <!-- Dinámico -->
            </div>

            <div class="print:hidden flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <button type="button" id="btn-agregar-menu-lista" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer">
                    + Agregar otro plato al plan
                </button>
                <button type="button" id="btn-generar-consolidado" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-6 py-2.5 rounded-xl transition shadow-sm cursor-pointer">
                    Generar Listado Consolidado
                </button>
            </div>
        </section>

        <!-- Historial de Listados Guardados (Visible en pantalla, oculto al imprimir) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
            <h3 class="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span>📚</span> Historial de Listados Guardados en Base de Datos
            </h3>
            <p class="text-xs text-slate-500 mb-4">Listados anteriores generados organizados por fecha.</p>
            <div id="historial-listados-container" class="space-y-3">
                <p class="text-xs text-slate-400">Cargando historial...</p>
            </div>
        </section>

        <section id="seccion-resultado-consolidado" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hidden print:block">
            <div class="border-b border-slate-200 pb-4 mb-4 flex justify-between items-end">
                <div>
                    <h3 class="text-base font-bold text-slate-900">Listado Consolidado de Insumos a Comprar</h3>
                    <p class="text-xs text-slate-500">Suma total de ingredientes requeridos para todos los menús seleccionados.</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-slate-500">Costo Total Estimado</p>
                    <p id="consolidado-costo-total" class="text-xl font-bold text-emerald-700">R$ 0.00</p>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-200 text-slate-500 text-xs">
                            <th class="py-2.5 px-3">Insumo / Alimento</th>
                            <th class="py-2.5 px-3">Cantidad Total Necesaria</th>
                            <th class="py-2.5 px-3">Precio Unitario Ref.</th>
                            <th class="py-2.5 px-3 text-right">Costo Parcial (R$)</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-consolidado-cuerpo" class="divide-y divide-slate-100 text-sm">
                        <!-- Dinámico -->
                    </tbody>
                </table>
            </div>
        </section>
    </main>

    <!-- Pie de página -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 print:hidden">
        Custo Receita &copy; 2026 - Gestión de Costos Gastronómicos
    </footer>

    <script type="module" src="listados.js"></script>
</body>
</html>
