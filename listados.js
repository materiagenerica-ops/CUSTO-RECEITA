function importarRangoFechas() {
    const fechaDesde = inputFechaDesde.value;
    const fechaHasta = inputFechaHasta.value;

    if (!fechaDesde || !fechaHasta) {
        alert("Por favor, selecciona tanto la fecha de inicio como la fecha de fin.");
        return;
    }

    if (fechaDesde > fechaHasta) {
        alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
        return;
    }

    const platosEnRango = cacheProduccion.filter(p => p.fecha && p.fecha >= fechaDesde && p.fecha <= fechaHasta);

    if (platosEnRango.length === 0) {
        alert(`No se encontraron platos registrados en el cronograma entre el ${fechaDesde} y el ${fechaHasta}.`);
        return;
    }

    let acumuladorPlatosRango = {};
    let noEncontrados = [];

    platosEnRango.forEach(p => {
        const nombrePlatoBuscado = limpiarTexto(p.nombrePlato);
        const recetaEncontrada = cacheRecetas.find(r => limpiarTexto(r.nombre) === nombrePlatoBuscado);

        if (recetaEncontrada) {
            const recetaId = recetaEncontrada.id;
            const comensales = parseInt(p.comensales) || 0;

            if (!acumuladorPlatosRango[recetaId]) {
                acumuladorPlatosRango[recetaId] = 0;
            }
            acumuladorPlatosRango[recetaId] += comensales;
        } else {
            if (!noEncontrados.includes(p.nombrePlato)) {
                noEncontrados.push(p.nombrePlato);
            }
        }
    });

    const recetaIdsUnicos = Object.keys(acumuladorPlatosRango);

    if (recetaIdsUnicos.length === 0) {
        alert("Se encontraron registros en las fechas, pero los nombres de los platos no coinciden con las recetas registradas. Revisa la consola (F12).");
        return;
    }

    // Limpiar contenedor y renderizar cada fila asegurando actualización visual
    selectorMenusContainer.innerHTML = "";

    recetaIdsUnicos.forEach((recetaId, index) => {
        const totalComensales = acumuladorPlatosRango[recetaId];
        // Si es el primer elemento, reemplaza el contenedor limpio; los siguientes los añade
        if (index === 0) {
            agregarFilaSelectorMenu(recetaId, totalComensales);
            // Remover la primera fila por defecto si se duplicara, pero aquí la usamos directamente
        } else {
            agregarFilaSelectorMenu(recetaId, totalComensales);
        }
    });

    // Forzar redibujado visual de los selects
    setTimeout(() => {
        alert(`¡Se importaron y acumularon ${recetaIdsUnicos.length} platos únicos con éxito!`);
    }, 50);
}
