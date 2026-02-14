// PA Table Generator - Native Drawing Version (Excel-like Quality)
let draggedRow = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-member-btn').addEventListener('click', addMemberRow);
    document.getElementById('add-song-btn').addEventListener('click', () => addSetListRow('song'));
    document.getElementById('add-mc-btn').addEventListener('click', () => addSetListRow('mc'));
    document.getElementById('generate-pdf-btn').addEventListener('click', generatePDF);

    initializeStageLayout();
    for (let i = 1; i <= 6; i++) addMemberRow(null, { mic: i, part: i === 5 ? 'ベース' : i === 6 ? 'パーカス' : '' });
    addSetListRow('song'); addSetListRow('song'); addSetListRow('song');
    updatePositions();
});

// --- Stage Layout & Table Logic (Dynamic) ---
function initializeStageLayout(count) {
    const num = count || document.getElementById('member-tbody')?.children.length || 6;
    const stage = document.getElementById('stage-layout');
    stage.innerHTML = '<div class="stage-label">ステージ</div>';
    for (let i = 1; i <= num; i++) {
        const box = document.createElement('div');
        box.className = 'stage-member-box';
        box.id = `stage-pos-${i}`;
        box.draggable = true;
        box.innerHTML = `<div class="member-num">${i}</div><div class="member-part">-</div>`;
        box.addEventListener('dragstart', e => { e.dataTransfer.setData('text', e.target.id); e.target.classList.add('dragging'); });
        box.addEventListener('dragover', e => e.preventDefault());
        box.addEventListener('drop', e => {
            e.preventDefault();
            const draggedEl = document.getElementById(e.dataTransfer.getData('text'));
            if (draggedEl !== e.target.closest('.stage-member-box')) {
                const temp = draggedEl.innerHTML;
                draggedEl.innerHTML = e.target.closest('.stage-member-box').innerHTML;
                e.target.closest('.stage-member-box').innerHTML = temp;
                syncTableWithStage();
            }
        });
        box.addEventListener('dragend', e => e.target.classList.remove('dragging'));
        stage.appendChild(box);
    }
}

function refreshStageLayout() {
    const memberCount = document.getElementById('member-tbody').children.length;
    initializeStageLayout(Math.max(memberCount, 1));
    updatePositions();
}

function syncTableWithStage() {
    const tbody = document.getElementById('member-tbody');
    const rows = Array.from(tbody.children);
    const memberCount = rows.length;
    const newOrder = [];
    for (let i = 1; i <= memberCount; i++) {
        const el = document.getElementById(`stage-pos-${i}`);
        if (!el) continue;
        const num = parseInt(el.querySelector('.member-num').textContent);
        if (num && rows[num - 1]) newOrder.push(rows[num - 1]);
    }
    newOrder.forEach(row => tbody.appendChild(row));
    updateMicNumbers();
    updatePositions();
}

function addMemberRow(e, data = {}) {
    const tbody = document.getElementById('member-tbody');
    const count = tbody.children.length + 1;
    const tr = document.createElement('tr');
    tr.draggable = true;
    tr.innerHTML = `<td style="cursor: move; text-align: center;">☰</td>
        <td><input type="text" class="form-control mic-input" value="" readonly style="width: 50px; background: #f3f4f6;"></td>
        <td><input type="text" class="form-control part-input" value="${data.part || ''}"></td>
        <td style="text-align: center;"><input type="radio" name="bandmaster" class="bandmaster-radio"></td>
        <td><input type="text" class="form-control name-input" value=""></td>
        <td><input type="text" class="form-control nickname-input" value=""></td>
        <td><input type="text" class="form-control position-input" value="" readonly style="width: 60px; text-align: center; background: #fef3c7;"></td>
        <td><button type="button" class="btn-delete" onclick="deleteMemberRow(this)">×</button></td>`;

    // Drag events
    tr.addEventListener('dragstart', e => { draggedRow = e.target.closest('tr'); draggedRow.style.opacity = '0.4'; });
    tr.addEventListener('dragover', e => e.preventDefault());
    tr.addEventListener('drop', e => {
        e.preventDefault();
        const target = e.target.closest('tr');
        if (draggedRow !== target) {
            const tbody = target.parentNode;
            const rows = Array.from(tbody.children);
            const dragIdx = rows.indexOf(draggedRow);
            const targetIdx = rows.indexOf(target);
            if (dragIdx < targetIdx) tbody.insertBefore(draggedRow, target.nextSibling);
            else tbody.insertBefore(draggedRow, target);
            updateMicNumbers();
            updatePositions();
        }
    });
    tr.addEventListener('dragend', () => draggedRow.style.opacity = '1');

    // Part input change event for auto mic numbering
    const partInput = tr.querySelector('.part-input');
    partInput.addEventListener('input', () => {
        updateMicNumbers();
        updatePositions();
    });

    tbody.appendChild(tr);
    updateMicNumbers();
    refreshStageLayout();
}

function deleteMemberRow(btn) { btn.closest('tr').remove(); updateMicNumbers(); refreshStageLayout(); }

function updateMicNumbers() {
    const rows = Array.from(document.getElementById('member-tbody').querySelectorAll('tr'));

    // 1. Identify reserved mics (Bass->5, Perc->6)
    const reservedMics = new Set();
    const rowAssignments = new Map(); // row -> micNum

    rows.forEach(tr => {
        const part = tr.querySelector('.part-input').value.toLowerCase().trim();
        if (part.includes('ベース') || part.includes('bass') || part.includes('ba.')) {
            rowAssignments.set(tr, 5);
            reservedMics.add(5);
        } else if (part.includes('パーカス') || part.includes('perc') || part.includes('ボイパ') || part.includes('vp')) {
            rowAssignments.set(tr, 6);
            reservedMics.add(6);
        }
    });

    // 2. Assign remaining mics
    let currentMic = 1;
    rows.forEach(tr => {
        if (!rowAssignments.has(tr)) {
            // Find next available mic
            while (reservedMics.has(currentMic)) {
                currentMic++;
            }
            rowAssignments.set(tr, currentMic);
            currentMic++;
        }
    });

    // 3. Apply to inputs
    rows.forEach(tr => {
        const micNum = rowAssignments.get(tr);
        tr.querySelector('.mic-input').value = micNum;

        // Update stage box info
        const pos = tr.querySelector('.position-input').value; // Position is 1-based index
        if (pos) {
            updateStageBox(pos, tr.querySelector('.part-input').value);
        }
    });
}

function updatePositions() {
    document.getElementById('member-tbody').querySelectorAll('tr').forEach((tr, i) => {
        tr.querySelector('.position-input').value = i + 1;
        const part = tr.querySelector('.part-input').value;
        updateStageBox(i + 1, part);
    });
    updatePositionPreview();
}

function updatePositionPreview() {
    const positions = Array.from(document.getElementById('member-tbody').children).map((tr, i) => `${i + 1}:${tr.querySelector('.part-input').value || '-'}`);
    document.getElementById('position-preview').textContent = positions.join(' → ');
}

function updateStageBox(num, part) {
    const box = document.getElementById(`stage-pos-${num}`);
    if (box) { box.querySelector('.member-num').textContent = num; box.querySelector('.member-part').textContent = part || '-'; }
}

function addSetListRow(type = 'song') {
    const tbody = document.getElementById('setlist-tbody');
    const count = tbody.children.length + 1;
    const tr = document.createElement('tr');
    if (type === 'mc') {
        tr.innerHTML = `<td class="row-index">${count}</td><td><select class="form-control type-select" onchange="updateSetListRow(this)"><option value="song">曲</option><option value="mc" selected>MC</option></select></td><td colspan="3" style="background: #fef3c7;"><input type="text" class="form-control mc-content" placeholder="MC内容" style="width: 100%;"></td><td><input type="text" class="form-control time-input" placeholder="時間" style="width: 100%;"></td><td><button type="button" class="btn-delete" onclick="deleteSetListRow(this)">×</button></td>`;
    } else {
        tr.innerHTML = `<td class="row-index">${count}</td><td><select class="form-control type-select" onchange="updateSetListRow(this)"><option value="song" selected>曲</option><option value="mc">MC</option></select></td><td><input type="text" class="form-control title-input" style="width: 100%;"></td><td><input type="text" class="form-control tempo-input" style="width: 100%;"></td><td><input type="text" class="form-control time-input" style="width: 100%;"></td><td><input type="text" class="form-control remarks-input" style="width: 100%;"></td><td><button type="button" class="btn-delete" onclick="deleteSetListRow(this)">×</button></td>`;
    }
    tbody.appendChild(tr);
}

function updateSetListRow(select) {
    const tr = select.closest('tr');
    const idx = Array.from(tr.parentNode.children).indexOf(tr);
    tr.parentNode.removeChild(tr);
    addSetListRow(select.value);
    const newRow = tr.parentNode.children[tr.parentNode.children.length - 1];
    if (idx < tr.parentNode.children.length) tr.parentNode.insertBefore(newRow, tr.parentNode.children[idx]);
    updateSetListIndices();
}

function deleteSetListRow(btn) { btn.closest('tr').remove(); updateSetListIndices(); }

function updateSetListIndices() {
    document.getElementById('setlist-tbody').querySelectorAll('tr').forEach((tr, i) => tr.querySelector('.row-index').textContent = i + 1);
}

// --- Native PDF Drawing Logic ---
async function generatePDF() {
    try {
        if (!window.jspdf) {
            alert('エラー: jsPDFライブラリが読み込まれていません。');
            return;
        }
        if (typeof JP_FONT_DATA === 'undefined') {
            alert('エラー: 日本語フォントデータが読み込まれていません。');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4'); // A4 size: 210mm x 297mm

        // 1. Register Font
        doc.addFileToVFS('ipaexg.ttf', JP_FONT_DATA);
        doc.addFont('ipaexg.ttf', 'ipaexg', 'normal');
        doc.setFont('ipaexg', 'normal');

        // --- Layout Constants ---
        const marginX = 15;
        const contentWidth = 180;
        const pageBottom = 280; // max Y before bottom margin
        const pageTopMargin = 15;
        let currentY = pageTopMargin;

        // --- Page Break Helper ---
        const checkPageBreak = (neededHeight) => {
            if (currentY + neededHeight > pageBottom) {
                doc.addPage();
                currentY = pageTopMargin;
            }
        };

        // --- Helper: Calculate cell height for wrapped text ---
        const calcCellHeight = (text, width, fontSize, minHeight = 7) => {
            if (!text) return minHeight;
            doc.setFontSize(fontSize);
            doc.setFont('ipaexg', 'normal');
            const lines = doc.splitTextToSize(String(text), width - 4);
            const lineHeight = fontSize * 0.3527 * 1.4;
            const textHeight = lines.length * lineHeight + 2;
            return Math.max(minHeight, textHeight);
        };

        // --- Helper: Draw Cell — always wraps text ---
        const drawCell = (x, y, w, h, text, align = 'center', fontSize = 10, fill = false) => {
            if (fill) {
                doc.setFillColor(230, 230, 230);
                doc.rect(x, y, w, h, 'F');
            }
            doc.setDrawColor(0);
            doc.setLineWidth(0.3);
            doc.rect(x, y, w, h);

            doc.setFontSize(fontSize);
            doc.setFont('ipaexg', 'normal');

            if (text) {
                const textStr = String(text);
                let textX = x + 2;
                if (align === 'center') textX = x + w / 2;
                else if (align === 'right') textX = x + w - 2;
                const jAlign = align === 'left' ? undefined : align;

                const lines = doc.splitTextToSize(textStr, w - 4);
                const lineHeight = fontSize * 0.3527 * 1.4;
                // Vertically center if single line, top-align if multi-line
                if (lines.length === 1) {
                    const textY = y + h / 2 + (fontSize * 0.3527 / 3);
                    doc.text(textStr, textX, textY, { align: jAlign });
                } else {
                    let startY = y + fontSize * 0.3527 + 1;
                    lines.forEach((line, idx) => {
                        doc.text(line, textX, startY + idx * lineHeight, { align: jAlign });
                    });
                }
            }
        };

        // --- Header Section ---
        drawCell(marginX, currentY, 30, 15, 'PA表', 'center', 16, true);

        drawCell(marginX + 30, currentY, 20, 6, '出演順', 'center', 8, true);
        const order = document.getElementById('order').value;
        drawCell(marginX + 30, currentY + 6, 20, 9, order, 'center', 12);

        drawCell(marginX + 50, currentY, 60, 6, 'バンド名', 'center', 8, true);
        const bandName = document.getElementById('bandName').value;
        drawCell(marginX + 50, currentY + 6, 60, 9, bandName, 'center', 12);

        drawCell(marginX + 110, currentY, 35, 6, '日付', 'center', 8, true);
        const eventDate = document.getElementById('eventDate').value;
        drawCell(marginX + 110, currentY + 6, 35, 9, eventDate, 'center', 10);

        drawCell(marginX + 145, currentY, 35, 6, 'イベント名', 'center', 8, true);
        const eventName = document.getElementById('eventName').value;
        drawCell(marginX + 145, currentY + 6, 35, 9, eventName, 'center', 10);

        currentY += 20;

        // --- Member Table ---
        const cols = [15, 30, 20, 50, 45, 20];
        const headers = ['マイク', 'パート', 'バンマス', '氏名', 'ニックネーム', '立ち位置'];
        let currentX = marginX;

        // Header Row
        headers.forEach((h, i) => {
            drawCell(currentX, currentY, cols[i], 7, h, 'center', 9, true);
            currentX += cols[i];
        });
        currentY += 7;

        // Data Rows (Dynamic based on actual member count, minimum 6)
        const memberRows = document.querySelectorAll('#member-tbody tr');
        const memberCount = memberRows.length;
        const totalMemberRows = Math.max(memberCount, 6);

        for (let i = 0; i < totalMemberRows; i++) {
            checkPageBreak(7);
            let mic = '', part = '', isBM = '', name = '', nick = '', pos = '';
            if (memberRows[i]) {
                const tr = memberRows[i];
                mic = tr.querySelector('.mic-input').value;
                part = tr.querySelector('.part-input').value;
                isBM = tr.querySelector('.bandmaster-radio').checked ? '○' : '';
                name = tr.querySelector('.name-input').value;
                nick = tr.querySelector('.nickname-input').value;
                pos = tr.querySelector('.position-input').value;
            } else {
                mic = (i + 1).toString();
            }

            // Compute row height from all text content
            const memberRowH = Math.max(
                calcCellHeight(part, cols[1], 10),
                calcCellHeight(name, cols[3], 10),
                calcCellHeight(nick, cols[4], 10),
                7
            );
            currentX = marginX;
            drawCell(currentX, currentY, cols[0], memberRowH, mic); currentX += cols[0];
            drawCell(currentX, currentY, cols[1], memberRowH, part); currentX += cols[1];
            drawCell(currentX, currentY, cols[2], memberRowH, isBM); currentX += cols[2];
            drawCell(currentX, currentY, cols[3], memberRowH, name, 'left'); currentX += cols[3];
            drawCell(currentX, currentY, cols[4], memberRowH, nick, 'left'); currentX += cols[4];
            drawCell(currentX, currentY, cols[5], memberRowH, pos); currentX += cols[5];
            currentY += memberRowH;
        }

        currentY += 5;

        // --- Stage Layout ---
        checkPageBreak(55);
        drawCell(marginX, currentY, contentWidth, 6, '立ち位置（ステージ側から見た図）', 'left', 9, true);
        currentY += 6;

        const stageHeight = 45;
        doc.rect(marginX, currentY, contentWidth, stageHeight);

        doc.setFontSize(8);
        doc.text('← 下手 (L)', marginX + 5, currentY + stageHeight - 2);
        doc.text('上手 (R) →', marginX + contentWidth - 5, currentY + stageHeight - 2, { align: 'right' });
        doc.text('Drums', marginX + contentWidth / 2, currentY + 10, { align: 'center' });

        // Draw Members — dynamic count & spacing
        const stageCenterY = currentY + 25;
        const activeMemberCount = memberRows.length || 1;
        const spacing = contentWidth / (activeMemberCount + 1);
        const circleR = Math.min(6, spacing * 0.35); // shrink circles for many members
        const labelFontSize = Math.min(11, circleR * 1.6);
        const partFontSize = Math.min(8, circleR * 1.2);
        const nickFontSize = Math.min(7, circleR * 1.0);

        memberRows.forEach((tr, i) => {
            const pos = parseInt(tr.querySelector('.position-input').value);
            const mic = tr.querySelector('.mic-input').value;
            const part = tr.querySelector('.part-input').value;
            const nick = tr.querySelector('.nickname-input').value;

            if (pos) {
                const cx = marginX + (spacing * pos);
                const cy = stageCenterY;

                doc.setLineWidth(0.3);
                doc.circle(cx, cy, circleR);

                doc.setFontSize(labelFontSize);
                doc.text(String(mic), cx, cy + circleR * 0.25, { align: 'center' });

                doc.setFontSize(partFontSize);
                doc.text(part || '', cx, cy + circleR + 4, { align: 'center' });

                doc.setFontSize(nickFontSize);
                doc.text(nick || '', cx, cy + circleR + 8, { align: 'center' });
            }
        });

        currentY += stageHeight + 5;

        // --- SE Info ---
        checkPageBreak(30);
        drawCell(marginX, currentY, contentWidth, 6, 'SE（音響）', 'left', 9, true);
        currentY += 6;

        const entranceSE = document.getElementById('entranceSE').value;
        const exitSE = document.getElementById('exitSE').value;
        const seRemarks = document.getElementById('seRemarks').value;

        const entranceSEH = calcCellHeight(entranceSE, 155, 9, 7);
        drawCell(marginX, currentY, 25, entranceSEH, '入場SE', 'center', 9);
        drawCell(marginX + 25, currentY, 155, entranceSEH, entranceSE, 'left');
        currentY += entranceSEH;

        const exitSEH = calcCellHeight(exitSE, 155, 9, 7);
        drawCell(marginX, currentY, 25, exitSEH, '退場SE', 'center', 9);
        drawCell(marginX + 25, currentY, 155, exitSEH, exitSE, 'left');
        currentY += exitSEH;

        // SE Remarks — with wrapping
        const seRemarksH = calcCellHeight(seRemarks, 155, 9, 10);
        drawCell(marginX, currentY, 25, seRemarksH, '備考', 'center', 9);
        drawCell(marginX + 25, currentY, 155, seRemarksH, seRemarks, 'left', 9);
        currentY += seRemarksH + 5;

        // --- Set List ---
        checkPageBreak(15);
        drawCell(marginX, currentY, contentWidth, 6, 'セットリスト', 'left', 9, true);
        currentY += 6;

        // 曲名:備考 = 1:1 → 57.5 each (total still 180)
        const setCols = [10, 15, 57.5, 20, 20, 57.5];
        const setHeaders = ['No.', '種類', '曲名 / MC内容', 'テンポ', '時間', '備考'];

        currentX = marginX;
        setHeaders.forEach((h, i) => {
            drawCell(currentX, currentY, setCols[i], 6, h, 'center', 9, true);
            currentX += setCols[i];
        });
        currentY += 6;

        const setlistRows = document.querySelectorAll('#setlist-tbody tr');
        const maxSetlistRows = Math.max(setlistRows.length, 5);

        for (let i = 0; i < maxSetlistRows; i++) {
            let type = '', title = '', tempo = '', time = '', remarks = '';
            let typeText = '';

            if (setlistRows[i]) {
                const tr = setlistRows[i];
                type = tr.querySelector('.type-select').value;
                title = tr.querySelector('.title-input')?.value || tr.querySelector('.mc-content')?.value || '';
                tempo = tr.querySelector('.tempo-input')?.value || '';
                time = tr.querySelector('.time-input')?.value || '';
                remarks = tr.querySelector('.remarks-input')?.value || '';
                typeText = type === 'mc' ? 'MC' : '曲';
            }

            // Calculate row height from both title and remarks
            const rowH = Math.max(
                calcCellHeight(title, setCols[2], 9, 7),
                calcCellHeight(remarks, setCols[5], 9, 7)
            );
            checkPageBreak(rowH);

            currentX = marginX;
            drawCell(currentX, currentY, setCols[0], rowH, (i + 1).toString()); currentX += setCols[0];
            drawCell(currentX, currentY, setCols[1], rowH, typeText); currentX += setCols[1];
            drawCell(currentX, currentY, setCols[2], rowH, title, 'left'); currentX += setCols[2];
            drawCell(currentX, currentY, setCols[3], rowH, tempo); currentX += setCols[3];
            drawCell(currentX, currentY, setCols[4], rowH, time); currentX += setCols[4];
            drawCell(currentX, currentY, setCols[5], rowH, remarks, 'left'); currentX += setCols[5];
            currentY += rowH;
        }

        currentY += 5;

        // --- Other Remarks ---
        const otherRemarks = document.getElementById('otherRemarks').value;
        const otherRemarksH = calcCellHeight(otherRemarks, contentWidth, 9, 20);
        checkPageBreak(otherRemarksH + 6);

        drawCell(marginX, currentY, contentWidth, 6, 'その他・要望', 'left', 9, true);
        currentY += 6;

        // Use remaining page space or text height, whichever is larger
        const remainingHeight = pageBottom - currentY - 10;
        const finalBoxH = Math.max(otherRemarksH, Math.min(remainingHeight, 40));
        drawCell(marginX, currentY, contentWidth, finalBoxH, otherRemarks, 'left', 9);

        // Save
        const filename = `${order}_${bandName}_PA表.pdf`;
        doc.save(filename);
        alert('PDFを作成しました！');

    } catch (e) {
        console.error(e);
        alert('エラーが発生しました: ' + e.message);
    }
}
