#target illustrator

// =============================================================================
// BackdropDesigner — Batch Export Logos
// Exporteert elk artboard als SVG of PNG naar public/logos/
// Voegt nieuwe sponsors toe aan sponsors.json (bestaande data blijft intact)
// =============================================================================

(function () {

    // ─── Guards ───────────────────────────────────────────────────────────────
    if (app.documents.length === 0) {
        alert('Geen document open in Illustrator.');
        return;
    }

    var doc = app.activeDocument;

    if (doc.artboards.length === 0) {
        alert('Geen artboards gevonden in het document.');
        return;
    }

    // ─── Prefs ────────────────────────────────────────────────────────────────
    function getPrefsFile() {
        var dir = new Folder(Folder.userData + '/BackdropDesigner');
        if (!dir.exists) dir.create();
        return new File(dir + '/batch_export.prefs');
    }

    function loadPrefs() {
        var prefs = { outputFolder: '', jsonFile: '', format: 'SVG', scale: '200' };
        var f = getPrefsFile();
        if (!f.exists) return prefs;
        f.open('r');
        while (!f.eof) {
            var line = f.readln();
            var idx = line.indexOf('=');
            if (idx > 0) {
                var key = line.substring(0, idx);
                var val = line.substring(idx + 1);
                if (prefs.hasOwnProperty(key)) prefs[key] = val;
            }
        }
        f.close();
        return prefs;
    }

    function savePrefs(prefs) {
        var f = getPrefsFile();
        f.open('w');
        for (var key in prefs) {
            if (prefs.hasOwnProperty(key)) f.writeln(key + '=' + prefs[key]);
        }
        f.close();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    // Bestandsnaam → weergavenaam: A_WARE → A WARE
    function filenameToPartner(name) {
        return name.replace(/_/g, ' ');
    }

    // Veilig JSON parsen (ES3)
    function parseJSON(str) {
        return eval('(' + str + ')');
    }

    // ─── Dialoog ──────────────────────────────────────────────────────────────
    var prefs = loadPrefs();

    var dlg = new Window('dialog', 'BackdropDesigner — Logo Batch Export');
    dlg.orientation = 'column';
    dlg.alignChildren = 'fill';
    dlg.spacing = 12;
    dlg.margins = 18;

    // Exportmap
    var panelFolder = dlg.add('panel', undefined, 'Exportmap  (public/logos/)');
    panelFolder.orientation = 'row';
    panelFolder.alignChildren = 'center';
    panelFolder.margins = [10, 16, 10, 10];
    var folderField = panelFolder.add('edittext', undefined, prefs.outputFolder);
    folderField.preferredSize.width = 340;
    var folderBtn = panelFolder.add('button', undefined, 'Bladeren\u2026');
    folderBtn.onClick = function () {
        var chosen = Folder.selectDialog('Kies de public/logos/ map van de BackdropDesigner app');
        if (chosen) folderField.text = chosen.fsName;
    };

    // sponsors.json
    var panelJson = dlg.add('panel', undefined, 'sponsors.json  (src/data/sponsors.json)');
    panelJson.orientation = 'row';
    panelJson.alignChildren = 'center';
    panelJson.margins = [10, 16, 10, 10];
    var jsonField = panelJson.add('edittext', undefined, prefs.jsonFile);
    jsonField.preferredSize.width = 340;
    var jsonBtn = panelJson.add('button', undefined, 'Bladeren\u2026');
    jsonBtn.onClick = function () {
        var chosen = File.openDialog('Kies sponsors.json', '*.json');
        if (chosen) jsonField.text = chosen.fsName;
    };

    // Formaat + schaal
    var panelFmt = dlg.add('panel', undefined, 'Exportformaat');
    panelFmt.orientation = 'row';
    panelFmt.alignChildren = 'center';
    panelFmt.margins = [10, 16, 10, 10];
    var rbSVG = panelFmt.add('radiobutton', undefined, 'SVG  (aanbevolen)');
    var rbPNG = panelFmt.add('radiobutton', undefined, 'PNG');
    panelFmt.add('statictext', undefined, '       Schaal:');
    var rb1x = panelFmt.add('radiobutton', undefined, '1\xd7');
    var rb2x = panelFmt.add('radiobutton', undefined, '2\xd7  (retina)');

    rbSVG.value = (prefs.format !== 'PNG');
    rbPNG.value = (prefs.format === 'PNG');
    rb1x.value  = (prefs.scale  === '100');
    rb2x.value  = (prefs.scale  !== '100');

    function updateUI() {
        rb1x.enabled = rbPNG.value;
        rb2x.enabled = rbPNG.value;
    }
    rbSVG.onClick = updateUI;
    rbPNG.onClick = updateUI;
    updateUI();

    // Info
    dlg.add('statictext', undefined,
        doc.artboards.length + ' artboards gevonden  \u00b7  ' + doc.name);

    // Knoppen
    var grpBtn = dlg.add('group');
    grpBtn.alignment = 'right';
    grpBtn.add('button', undefined, 'Annuleren', { name: 'cancel' });
    grpBtn.add('button', undefined, 'Exporteren \u2192', { name: 'ok' });

    if (dlg.show() !== 1) return;

    // ─── Validatie ────────────────────────────────────────────────────────────
    var outputFolder = new Folder(folderField.text);
    var jsonFilePath  = jsonField.text;
    var format        = rbPNG.value ? 'PNG' : 'SVG';
    var scale         = rb2x.value  ? 200   : 100;

    if (folderField.text === '' || !outputFolder.exists) {
        alert('Exportmap bestaat niet of is niet ingesteld.\n' + folderField.text);
        return;
    }

    // Prefs opslaan
    prefs.outputFolder = folderField.text;
    prefs.jsonFile     = jsonFilePath;
    prefs.format       = format;
    prefs.scale        = String(scale);
    savePrefs(prefs);

    // ─── Artboard-namen verzamelen (BLANK altijd overslaan) ───────────────────
    // Bewaar zowel de artboard-index als de naam zodat setActiveArtboardIndex
    // altijd de juiste artboard activeert (niet verschoven door BLANK-filtering).
    var SKIP = { 'BLANK': true };   // namen die nooit geëxporteerd worden
    var artboards = [];  // [{ index, name }]
    for (var i = 0; i < doc.artboards.length; i++) {
        var n = doc.artboards[i].name;
        if (!SKIP[n]) artboards.push({ index: i, name: n });
    }

    // ─── Export ───────────────────────────────────────────────────────────────
    var exported = [];   // namen die succesvol zijn geëxporteerd
    var errors   = [];   // foutmeldingen

    if (format === 'PNG') {

        for (var i = 0; i < artboards.length; i++) {
            var ab     = artboards[i];
            var abName = ab.name;
            doc.artboards.setActiveArtboardIndex(ab.index);  // gebruik originele index
            var outFile = new File(outputFolder.fsName + '/' + abName + '.png');
            try {
                var pngOpts = new ExportOptionsPNG24();
                pngOpts.artBoardClipping  = true;
                pngOpts.horizontalScale   = scale;
                pngOpts.verticalScale     = scale;
                pngOpts.transparency      = true;
                pngOpts.antiAliasing      = true;
                doc.exportFile(outFile, ExportType.PNG24, pngOpts);
                exported.push(abName);
            } catch (e) {
                errors.push(abName + ' \u2014 ' + e.message);
            }
        }

    } else {
        // SVG: Illustrator exporteert alle artboards met suffix _01, _02 ...
        // We exporteren naar een tijdelijke basisnaam en hernoemen daarna.
        // Gebruik doc.artboards.length als range zodat alle artboards meegenomen worden.

        var TEMP = '_bd_temp_';
        var tempBase = new File(outputFolder.fsName + '/' + TEMP + 'export');

        try {
            var svgOpts = new ExportOptionsSVG();
            svgOpts.saveMultipleArtboards  = true;
            svgOpts.artboardRange          = '1-' + doc.artboards.length;
            svgOpts.embedRasterImages      = true;
            svgOpts.fontSubsetting         = SVGFontSubsetting.None;
            svgOpts.cssProperties          = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
            svgOpts.coordinatePrecision    = 3;
            doc.exportFile(tempBase, ExportType.SVG, svgOpts);
        } catch (e) {
            alert('SVG export mislukt:\n' + e.message);
            return;
        }

        // Tijdelijke bestanden hernoemen naar artboard-naam.
        // De suffix loopt over ALLE artboards (inclusief BLANK) — gebruik ab.index + 1.
        for (var i = 0; i < artboards.length; i++) {
            var ab     = artboards[i];
            var abName = ab.name;
            var suffix = (ab.index + 1 < 10 ? '0' : '') + String(ab.index + 1);
            var tempFile = new File(outputFolder.fsName + '/' + TEMP + 'export_' + suffix + '.svg');

            if (!tempFile.exists) {
                errors.push(abName + ' \u2014 tijdelijk bestand niet gevonden (' + tempFile.name + ')');
                continue;
            }

            // Verwijder eventueel bestaande versie
            var destFile = new File(outputFolder.fsName + '/' + abName + '.svg');
            if (destFile.exists) destFile.remove();

            // Hernoem (binnen dezelfde map)
            tempFile.rename(abName + '.svg');
            exported.push(abName);
        }
    }

    // ─── sponsors.json bijwerken ──────────────────────────────────────────────
    // Alleen NIEUWE sponsors worden toegevoegd.
    // Bestaande entries worden nooit gewijzigd — tags en event-data blijven intact.

    var newCount    = 0;
    var jsonUpdated = false;

    if (jsonFilePath !== '') {
        var jsonFile = new File(jsonFilePath);

        if (!jsonFile.exists) {
            errors.push('sponsors.json niet gevonden:\n' + jsonFilePath);
        } else {
            // Lees huidige inhoud
            jsonFile.open('r');
            var jsonStr = jsonFile.read();
            jsonFile.close();

            var sponsors = parseJSON(jsonStr);

            // Bouw lookup van bestaande bestandsnamen
            var known = {};
            for (var i = 0; i < sponsors.length; i++) {
                known[sponsors[i].filename] = true;
            }

            // Verzamel nieuwe entries
            var newEntries = [];
            for (var i = 0; i < exported.length; i++) {
                var fname = exported[i];
                if (!known[fname]) {
                    newEntries.push(
                        '  { "partner": "' + filenameToPartner(fname) +
                        '", "filename": "' + fname + '" }'
                    );
                    newCount++;
                }
            }

            // Voeg nieuwe entries toe door de bestaande JSON veilig uit te breiden
            // (de bestaande inhoud wordt nooit herschreven)
            if (newCount > 0) {
                var trimmed = jsonStr.replace(/\s+$/, '');
                var closeIdx = trimmed.lastIndexOf(']');
                var before   = trimmed.substring(0, closeIdx).replace(/,?\s*$/, '');
                var isEmpty  = before.replace(/[\[\s]/g, '') === '';

                var newJson  = before +
                    (isEmpty ? '\n' : ',\n') +
                    newEntries.join(',\n') +
                    '\n]';

                jsonFile.open('w');
                jsonFile.write(newJson);
                jsonFile.close();
                jsonUpdated = true;
            }
        }
    }

    // ─── Samenvatting ─────────────────────────────────────────────────────────
    var msg = '\u2713 ' + exported.length + ' logo\u2019s ge\u00ebxporteerd als ' + format + '.';

    if (newCount > 0) {
        msg += '\n\u2713 ' + newCount + ' nieuwe sponsor(s) toegevoegd aan sponsors.json.';
    } else if (jsonFilePath !== '' && exported.length > 0) {
        msg += '\n\u2713 sponsors.json ongewijzigd \u2014 alle sponsors stonden al in de lijst.';
    }

    if (errors.length > 0) {
        msg += '\n\n\u26a0 Waarschuwingen (' + errors.length + '):\n' + errors.join('\n');
    }

    alert(msg);

})();
