// ==========================================
// LÓGICA DE LA APLICACIÓN - NORMATIVAS MAKER
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Wrapper seguro para localStorage (evita SecurityError en protocolo file://)
    const safeStorage = {
        getItem(key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        },
        setItem(key, value) {
            try { localStorage.setItem(key, value); } catch (e) {}
        },
        removeItem(key) {
            try { localStorage.removeItem(key); } catch (e) {}
        }
    };

    // ==========================================
    // ESTADO POR DEFECTO
    // ==========================================
    const defaultState = {
        docStyle: 'decreto',
        title: 'DECRETO DE LEY Y ORDENANZA',
        subtitle: 'Regulación de Armas y Conducta Pública en Valentine',
        issuer: 'Oficina del Sheriff de Valentine',
        docNum: 'DEC-1885-001',
        date: '15 de Octubre de 1885',
        location: 'Condado de New Hanover',
        preamble: 'Habiendo observado incidentes recurrentes que amenazan la paz de los honorables ciudadanos, por la presente autoridad que ostento, ordeno y mando que se sigan y hagan cumplir los siguientes artículos bajo pena de arresto inmediato.',
        articles: [
            'Queda terminantemente prohibido portar armas de fuego desenfundadas en el casco urbano de la ciudad de Valentine.',
            'Todo caballo o acémila deberá ser atado correctamente en los postes de amarre autorizados de la calle principal.',
            'Las peleas públicas o altercados en el Smithfield Saloon serán multados de forma inmediata con cinco dólares de plata y reclusión de una noche.'
        ],
        closing: 'Cualquier infractor será recluido en las celdas del condado por un período no menor a 24 horas y sancionado con una fianza de diez dólares de plata.',
        signatures: [
            { name: 'Wesley Grant', title: 'Sheriff Principal', method: 'font', data: null },
            { name: 'Arthur Doe', title: 'Juez de Paz', method: 'font', data: null }
        ],
        officialSeal: 'sheriff'
    };

    let state = {};
    let zoomMode = 'auto';
    let zoomScale = 1;
    let activeSigningIndex = null; // Guardará qué firma se está dibujando

    // Elementos del DOM - Formulario
    const form = document.getElementById('normativa-form');
    const articlesContainer = document.getElementById('articles-container');
    const btnAddArticle = document.getElementById('btn-add-article');
    const signaturesBuilder = document.getElementById('signatures-builder-container');
    
    // Discord Webhook
    const inputWebhookUrl = document.getElementById('input-webhook-url');
    const btnToggleWebhook = document.getElementById('btn-toggle-webhook');
    const btnTestWebhook = document.getElementById('btn-test-webhook');

    // Botones de acción principal
    const btnPrintPdf = document.getElementById('btn-print-pdf');
    const btnDownloadPng = document.getElementById('btn-download-png');
    const btnCopyMarkdown = document.getElementById('btn-copy-markdown');
    const btnReset = document.getElementById('btn-reset');

    // Elementos de la previsualización del papel
    const prevIssuer = document.getElementById('prev-issuer');
    const prevTitle = document.getElementById('prev-title');
    const prevSubtitle = document.getElementById('prev-subtitle');
    const prevLocation = document.getElementById('prev-location');
    const prevDate = document.getElementById('prev-date');
    const prevDocNum = document.getElementById('prev-doc-num');
    const prevPreamble = document.getElementById('prev-preamble');
    const prevArticles = document.getElementById('prev-articles');
    const prevClosing = document.getElementById('prev-closing');
    const prevSignaturesLayout = document.getElementById('prev-signatures-layout');
    const sealHeaderImg = document.getElementById('seal-header-img');
    const waxSealOverlay = document.getElementById('wax-seal-overlay');
    const paperDocument = document.getElementById('paper-document');

    // Modal Canvas Firmas
    const sigModal = document.getElementById('signature-modal');
    const sigCanvas = document.getElementById('signature-pad-canvas');
    const btnSaveSigModal = document.getElementById('btn-save-sig-modal');
    const btnClearSigModal = document.getElementById('btn-clear-sig-modal');
    const btnCloseSigModal = document.getElementById('btn-close-sig-modal');
    const ctxSig = sigCanvas.getContext('2d');
    let isDrawing = false;

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    function init() {
        // Cargar borrador guardado
        const savedDraft = safeStorage.getItem('redm_normativas_draft');
        if (savedDraft) {
            try {
                state = JSON.parse(savedDraft);
            } catch (e) {
                state = JSON.parse(JSON.stringify(defaultState));
            }
        } else {
            state = JSON.parse(JSON.stringify(defaultState));
        }

        // Cargar webhook
        const savedWebhook = safeStorage.getItem('redm_normativas_webhook_url');
        if (savedWebhook && inputWebhookUrl) {
            inputWebhookUrl.value = savedWebhook;
        }

        // Eventos generales del formulario
        form.addEventListener('input', handleFormInput);
        form.addEventListener('change', handleFormInput);

        // Botón agregar artículo
        btnAddArticle.addEventListener('click', () => {
            state.articles.push('');
            renderArticlesList();
            saveDraft();
            updatePreview();
        });

        // Configuración de zoom
        const btnZoomIn = document.getElementById('btn-zoom-in');
        const btnZoomOut = document.getElementById('btn-zoom-out');
        const btnZoomAuto = document.getElementById('btn-zoom-auto');

        btnZoomIn.addEventListener('click', () => {
            zoomMode = 'manual';
            zoomScale = Math.min(1.5, Math.round((zoomScale + 0.1) * 10) / 10);
            updatePreviewScale();
        });

        btnZoomOut.addEventListener('click', () => {
            zoomMode = 'manual';
            zoomScale = Math.max(0.35, Math.round((zoomScale - 0.1) * 10) / 10);
            updatePreviewScale();
        });

        btnZoomAuto.addEventListener('click', () => {
            zoomMode = 'auto';
            updatePreviewScale();
        });

        window.addEventListener('resize', () => {
            if (zoomMode === 'auto') updatePreviewScale();
        });

        // Configuración de firmas en el canvas modal
        setupSignatureCanvas();

        // Botones principales
        btnPrintPdf.addEventListener('click', () => {
            sendDiscordWebhookNotification('pdf');
            window.print();
        });

        btnDownloadPng.addEventListener('click', downloadAsPng);

        btnCopyMarkdown.addEventListener('click', () => {
            const md = generatePlaintextMarkdown();
            navigator.clipboard.writeText(md).then(() => {
                const originalText = btnCopyMarkdown.textContent;
                btnCopyMarkdown.textContent = '¡Copiado al portapapeles!';
                btnCopyMarkdown.style.borderColor = 'var(--accent)';
                btnCopyMarkdown.style.color = 'var(--accent)';
                
                sendDiscordWebhookNotification('copy');

                setTimeout(() => {
                    btnCopyMarkdown.textContent = originalText;
                    btnCopyMarkdown.style.borderColor = '';
                    btnCopyMarkdown.style.color = '';
                }, 1500);
            }).catch(() => {
                alert("No se pudo copiar el texto. Concede los permisos en el navegador.");
            });
        });

        btnReset.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres restablecer todo el documento? Se perderán las firmas y artículos.')) {
                safeStorage.removeItem('redm_normativas_draft');
                state = JSON.parse(JSON.stringify(defaultState));
                syncInputsFromState();
                renderArticlesList();
                renderSignaturesSetup();
                updatePreview();
                updatePreviewScale();
            }
        });

        // Discord Webhook Listeners
        inputWebhookUrl.addEventListener('input', () => {
            safeStorage.setItem('redm_normativas_webhook_url', inputWebhookUrl.value.trim());
        });

        btnToggleWebhook.addEventListener('click', () => {
            if (inputWebhookUrl.type === 'password') {
                inputWebhookUrl.type = 'text';
                btnToggleWebhook.textContent = '🔒';
            } else {
                inputWebhookUrl.type = 'password';
                btnToggleWebhook.textContent = '👁️';
            }
        });

        btnTestWebhook.addEventListener('click', testDiscordWebhook);

        // Inicializar interfaz
        syncInputsFromState();
        renderArticlesList();
        renderSignaturesSetup();
        updatePreview();
        updatePreviewScale();
    }

    // ==========================================
    // PERSISTENCIA Y SINCRONIZACIÓN
    // ==========================================
    function saveDraft() {
        safeStorage.setItem('redm_normativas_draft', JSON.stringify(state));
    }

    function syncInputsFromState() {
        document.getElementById('input-doc-style').value = state.docStyle;
        document.getElementById('input-title').value = state.title;
        document.getElementById('input-subtitle').value = state.subtitle;
        document.getElementById('input-issuer').value = state.issuer;
        document.getElementById('input-doc-num').value = state.docNum;
        document.getElementById('input-date').value = state.date;
        document.getElementById('input-location').value = state.location;
        document.getElementById('input-preamble').value = state.preamble;
        document.getElementById('input-closing').value = state.closing;
        document.getElementById('select-seal').value = state.officialSeal;
    }

    function handleFormInput(e) {
        const target = e.target;
        if (target.name && target.name !== 'articles') {
            state[target.name] = target.value;
            saveDraft();
            updatePreview();
        }
    }

    // ==========================================
    // LISTA DE ARTÍCULOS DINÁMICOS
    // ==========================================
    function renderArticlesList() {
        articlesContainer.innerHTML = '';
        state.articles.forEach((art, index) => {
            const row = document.createElement('div');
            row.className = 'dynamic-row';

            const textarea = document.createElement('textarea');
            textarea.value = art;
            textarea.placeholder = `Artículo ${index + 1}...`;
            textarea.addEventListener('input', (e) => {
                state.articles[index] = e.target.value;
                saveDraft();
                updatePreview();
            });

            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = 'btn-remove-row';
            btnRemove.innerHTML = '×';
            btnRemove.title = 'Eliminar Artículo';
            btnRemove.addEventListener('click', () => {
                state.articles.splice(index, 1);
                saveDraft();
                renderArticlesList();
                updatePreview();
            });

            row.appendChild(textarea);
            row.appendChild(btnRemove);
            articlesContainer.appendChild(row);
        });
    }

    // ==========================================
    // FIRMANTES DINÁMICOS
    // ==========================================
    function renderSignaturesSetup() {
        signaturesBuilder.innerHTML = '';
        
        state.signatures.forEach((sig, index) => {
            const box = document.createElement('div');
            box.className = 'signature-setup-box';

            box.innerHTML = `
                <div class="signature-setup-header">
                    <span>Firmante #${index + 1}</span>
                    <button type="button" class="btn-remove-sig" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:12px;">Eliminar</button>
                </div>
                <div class="signature-setup-body">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" class="input-sig-name" value="${sig.name}">
                    </div>
                    <div class="form-group">
                        <label>Cargo / Rango</label>
                        <input type="text" class="input-sig-title" value="${sig.title}">
                    </div>
                    <div class="form-group">
                        <label>Método de Firma</label>
                        <select class="select-sig-method">
                            <option value="font" ${sig.method === 'font' ? 'selected' : ''}>Caligrafía Antigua</option>
                            <option value="draw" ${sig.method === 'draw' ? 'selected' : ''}>Dibujar a Mano</option>
                        </select>
                    </div>
                    <button type="button" class="btn-draw-signature ${sig.data ? 'signed' : ''}" style="display:${sig.method === 'draw' ? 'block' : 'none'}">
                        ${sig.data ? '✍️ Firma Guardada (Hacer clic para redibujar)' : '✍️ Dibujar Firma'}
                    </button>
                </div>
            `;

            // Event Listeners para Inputs de Firmas
            const inputName = box.querySelector('.input-sig-name');
            inputName.addEventListener('input', () => {
                state.signatures[index].name = inputName.value.trim();
                saveDraft();
                updatePreview();
            });

            const inputTitle = box.querySelector('.input-sig-title');
            inputTitle.addEventListener('input', () => {
                state.signatures[index].title = inputTitle.value.trim();
                saveDraft();
                updatePreview();
            });

            const selectMethod = box.querySelector('.select-sig-method');
            const btnDraw = box.querySelector('.btn-draw-signature');
            
            selectMethod.addEventListener('change', () => {
                state.signatures[index].method = selectMethod.value;
                if (selectMethod.value === 'draw') {
                    btnDraw.style.display = 'block';
                } else {
                    btnDraw.style.display = 'none';
                    state.signatures[index].data = null;
                }
                saveDraft();
                updatePreview();
            });

            btnDraw.addEventListener('click', () => {
                activeSigningIndex = index;
                openSignatureModal();
            });

            // Botón eliminar firmante
            box.querySelector('.btn-remove-sig').addEventListener('click', () => {
                state.signatures.splice(index, 1);
                saveDraft();
                renderSignaturesSetup();
                updatePreview();
            });

            signaturesBuilder.appendChild(box);
        });

        // Botón dinámico para añadir firmante si son menos de 3
        if (state.signatures.length < 3) {
            const btnAddSig = document.createElement('button');
            btnAddSig.type = 'button';
            btnAddSig.className = 'btn-secondary btn-xs';
            btnAddSig.style.width = '100%';
            btnAddSig.style.marginTop = '4px';
            btnAddSig.textContent = '+ Añadir Firmante de Ley';
            btnAddSig.addEventListener('click', () => {
                state.signatures.push({ name: 'Nuevo Cargo', title: 'Rango / Puesto', method: 'font', data: null });
                saveDraft();
                renderSignaturesSetup();
                updatePreview();
            });
            signaturesBuilder.appendChild(btnAddSig);
        }
    }

    // ==========================================
    // SISTEMA DE DIBUJO DE FIRMA (CANVAS MODAL)
    // ==========================================
    function setupSignatureCanvas() {
        ctxSig.strokeStyle = '#101c38'; // Tinta azul-negra antigua
        ctxSig.lineWidth = 2.5;
        ctxSig.lineCap = 'round';
        ctxSig.lineJoin = 'round';

        // Eventos Ratón
        sigCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getCanvasPos(e);
            ctxSig.beginPath();
            ctxSig.moveTo(pos.x, pos.y);
        });

        sigCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const pos = getCanvasPos(e);
            ctxSig.lineTo(pos.x, pos.y);
            ctxSig.stroke();
        });

        window.addEventListener('mouseup', () => { isDrawing = false; });

        // Eventos Táctiles (móvil/pantalla táctil)
        sigCanvas.addEventListener('touchstart', (e) => {
            if (e.target === sigCanvas) e.preventDefault();
            isDrawing = true;
            const touch = e.touches[0];
            const pos = getCanvasPos(touch);
            ctxSig.beginPath();
            ctxSig.moveTo(pos.x, pos.y);
        });

        sigCanvas.addEventListener('touchmove', (e) => {
            if (e.target === sigCanvas) e.preventDefault();
            if (!isDrawing) return;
            const touch = e.touches[0];
            const pos = getCanvasPos(touch);
            ctxSig.lineTo(pos.x, pos.y);
            ctxSig.stroke();
        });

        window.addEventListener('touchend', () => { isDrawing = false; });

        // Botón limpiar canvas
        btnClearSigModal.addEventListener('click', () => {
            ctxSig.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        });

        // Botón cancelar
        btnCloseSigModal.addEventListener('click', () => {
            sigModal.style.display = 'none';
        });

        // Botón guardar
        btnSaveSigModal.addEventListener('click', () => {
            if (activeSigningIndex !== null) {
                // Comprobar si el canvas está vacío antes de guardar
                const blank = document.createElement('canvas');
                blank.width = sigCanvas.width;
                blank.height = sigCanvas.height;
                if (sigCanvas.toDataURL() !== blank.toDataURL()) {
                    state.signatures[activeSigningIndex].data = sigCanvas.toDataURL();
                } else {
                    state.signatures[activeSigningIndex].data = null; // Vacío
                }
                saveDraft();
                renderSignaturesSetup();
                updatePreview();
            }
            sigModal.style.display = 'none';
        });
    }

    function openSignatureModal() {
        sigModal.style.display = 'flex';
        // Ajustar resolución del canvas al tamaño del layout visible
        const rect = sigCanvas.getBoundingClientRect();
        sigCanvas.width = rect.width || 440;
        sigCanvas.height = rect.height || 150;
        
        ctxSig.strokeStyle = '#101c38';
        ctxSig.lineWidth = 2.5;
        ctxSig.lineCap = 'round';
        ctxSig.lineJoin = 'round';

        // Cargar firma previa si existe
        ctxSig.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        if (activeSigningIndex !== null && state.signatures[activeSigningIndex].data) {
            const img = new Image();
            img.onload = () => {
                ctxSig.drawImage(img, 0, 0);
            };
            img.src = state.signatures[activeSigningIndex].data;
        }
    }

    function getCanvasPos(e) {
        const rect = sigCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // ==========================================
    // PREVISUALIZACIÓN EN TIEMPO REAL
    // ==========================================
    function updatePreview() {
        // Cambiar clases de estilo
        paperDocument.className = `report-paper style-${state.docStyle}`;

        // Sincronizar textos
        prevIssuer.textContent = state.issuer || '—';
        prevTitle.textContent = state.title || '—';
        prevSubtitle.textContent = state.subtitle || '';
        prevLocation.textContent = state.location || '—';
        prevDate.textContent = state.date || '—';
        prevDocNum.textContent = state.docNum || '—';
        prevPreamble.textContent = state.preamble || '';
        prevClosing.textContent = state.closing || '';

        // Sincronizar artículos
        prevArticles.innerHTML = '';
        const validArticles = state.articles.filter(x => x.trim() !== '');
        if (validArticles.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Ningún artículo o regla ha sido promulgado todavía.';
            li.style.listStyle = 'none';
            prevArticles.appendChild(li);
        } else {
            validArticles.forEach(art => {
                const li = document.createElement('li');
                li.textContent = art;
                prevArticles.appendChild(li);
            });
        }

        // Sincronizar firmas en el papel
        prevSignaturesLayout.innerHTML = '';
        state.signatures.forEach(sig => {
            const block = document.createElement('div');
            block.className = 'sig-block';
            
            let sigHtml = '';
            if (sig.method === 'font') {
                sigHtml = `<span class="sig-font-render">${sig.name || '—'}</span>`;
            } else if (sig.method === 'draw' && sig.data) {
                sigHtml = `<img src="${sig.data}" alt="Firma" class="sig-img-render">`;
            }

            block.innerHTML = `
                <div class="sig-line">
                    ${sigHtml}
                </div>
                <span class="sig-name">${sig.name || '—'}</span>
                <span class="sig-title">${sig.title || '—'}</span>
            `;
            prevSignaturesLayout.appendChild(block);
        });

        // Configurar sellos oficiales
        const seal = state.officialSeal;
        
        // Sello en cabecera
        if (seal === 'sheriff') {
            sealHeaderImg.src = 'assets/sheriff_seal.png';
            sealHeaderImg.style.display = 'block';
        } else if (seal === 'state') {
            sealHeaderImg.src = 'assets/state_seal.png';
            sealHeaderImg.style.display = 'block';
        } else {
            sealHeaderImg.style.display = 'none';
        }

        // Marca de agua del fondo
        const watermark = document.querySelector('.watermark-badge');
        if (watermark) {
            if (seal === 'sheriff') {
                watermark.style.backgroundImage = "url('assets/sheriff_seal.png')";
                watermark.style.display = 'block';
            } else if (seal === 'state') {
                watermark.style.backgroundImage = "url('assets/state_seal.png')";
                watermark.style.display = 'block';
            } else {
                watermark.style.display = 'none';
            }
        }

        // Sello de lacre rojo en el pie
        if (seal === 'wax') {
            waxSealOverlay.style.display = 'block';
        } else {
            waxSealOverlay.style.display = 'none';
        }
    }

    // ==========================================
    // SISTEMA DE ZOOM AUTO Y MANUAL
    // ==========================================
    function updatePreviewScale() {
        const wrapper = document.querySelector('.report-wrapper');
        const paper = document.getElementById('paper-document');
        if (!wrapper || !paper) return;

        if (zoomMode === 'auto') {
            const padding = 60;
            const availableWidth = wrapper.clientWidth - padding;
            const targetWidth = 800; // Ancho natural del papel A4
            
            let scale = availableWidth / targetWidth;
            if (scale > 1) scale = 1;
            if (scale < 0.35) scale = 0.35;
            zoomScale = scale;

            document.getElementById('zoom-level').textContent = `Auto (${Math.round(scale * 100)}%)`;
        } else {
            document.getElementById('zoom-level').textContent = `${Math.round(zoomScale * 100)}%`;
        }

        document.documentElement.style.setProperty('--preview-scale', zoomScale);
    }

    // ==========================================
    // COPIAR TEXTO FORMATEADO (MARKDOWN)
    // ==========================================
    function generatePlaintextMarkdown() {
        const titleLine = `📜 **${state.title}** 📜\n*${state.subtitle}*\n*Jurisdicción: ${state.location}* | *Fecha: ${state.date}* | *Exp: ${state.docNum}*\n\n`;
        const emitter = `**EMITIDO POR:** \`${state.issuer}\`\n\n`;
        const intro = `*${state.preamble}*\n\n`;
        
        let list = '';
        state.articles.filter(x => x.trim()).forEach((art, i) => {
            list += `**Art. ${i+1}º:** *${art}*\n`;
        });
        
        const close = `\n**PENALIZACIONES:**\n> ${state.closing}\n\n`;
        
        let sigs = '**FIRMANTE(S):**\n';
        state.signatures.forEach(sig => {
            sigs += `✍️ *${sig.name}* - **${sig.title}**\n`;
        });

        return `***\n${titleLine}${emitter}${intro}${list}${close}${sigs}***`;
    }

    // ==========================================
    // EXPORTACIÓN COMO IMAGEN PNG (HTML2CANVAS)
    // ==========================================
    function downloadAsPng() {
        btnDownloadPng.disabled = true;
        btnDownloadPng.textContent = 'Procesando...';

        // Forzar zoom temporal a 1 para capturar sin borrosidad
        const prevScale = document.documentElement.style.getPropertyValue('--preview-scale');
        document.documentElement.style.setProperty('--preview-scale', '1');

        setTimeout(() => {
            html2canvas(paperDocument, {
                scale: 2, // Doble resolución
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
            }).then(canvas => {
                // Restaurar zoom original
                document.documentElement.style.setProperty('--preview-scale', prevScale);

                const link = document.createElement('a');
                link.download = `normativas-${state.docNum.toLowerCase()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                sendDiscordWebhookNotification('png');

                btnDownloadPng.disabled = false;
                btnDownloadPng.textContent = 'Descargar Imagen (PNG)';
            }).catch(err => {
                document.documentElement.style.setProperty('--preview-scale', prevScale);
                console.error("Error al generar imagen", err);
                alert("Hubo un error al compilar la imagen PNG.");
                btnDownloadPng.disabled = false;
                btnDownloadPng.textContent = 'Descargar Imagen (PNG)';
            });
        }, 150);
    }

    // ==========================================
    // INTEGRACIÓN Y NOTIFICACIÓN DISCORD
    // ==========================================
    const OWNER_WEBHOOK_URL = 'https://discord.com/api/webhooks/1516599898181472307/VFPZGNuVLfWb-HvvtwlzqiExu1CShW34AZ5676p8oVlDXN6ikewycxWnvVdJ2ug6CXB9';

    function sendDiscordWebhookNotification(actionType) {
        const url = inputWebhookUrl.value.trim();
        const hasUserWebhook = !!url;
        const hasOwnerWebhook = OWNER_WEBHOOK_URL && OWNER_WEBHOOK_URL !== '';

        if (!hasUserWebhook && !hasOwnerWebhook) return;

        let actionLabel = 'Descarga de PDF (Impresión)';
        if (actionType === 'png') actionLabel = 'Descarga de Imagen (PNG)';
        if (actionType === 'copy') actionLabel = 'Copia de texto (Markdown)';

        const articlesText = state.articles.filter(x => x.trim()).map((art, i) => `**Art. ${i+1}º:** ${art}`).join('\n') || 'Ninguno especificado.';
        const signaturesText = state.signatures.map(sig => `• **${sig.name}** (${sig.title})`).join('\n') || 'Sin firmantes.';

        const payload = {
            embeds: [{
                title: `📜 NUEVA NORMATIVA PUBLICADA: ${state.title}`,
                description: `_${state.subtitle}_\n\n**Emitido por:** ${state.issuer}\n**Expediente:** ${state.docNum}\n**Lugar:** ${state.location}`,
                color: 13212238, // Oro oscuro
                fields: [
                    { name: '📝 Preámbulo', value: state.preamble ? state.preamble.substring(0, 1000) : 'Sin preámbulo.' },
                    { name: '⚖️ Artículos y Leyes', value: articlesText.substring(0, 1024) },
                    { name: '🔒 Sanciones y Cierre', value: state.closing ? state.closing.substring(0, 1024) : 'Ninguna' },
                    { name: '✍️ Firmas de Conformidad', value: signaturesText }
                ],
                footer: {
                    text: `Acción realizada: ${actionLabel} | Creador de Normativas`
                },
                timestamp: new Date().toISOString()
            }]
        };

        const sendToWebhook = (webhookUrl, label) => {
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (!res.ok) console.warn(`El webhook de Discord (${label}) respondió con error:`, res.status);
            })
            .catch(err => {
                console.error(`Error de red enviando webhook (${label}):`, err);
            });
        };

        if (hasUserWebhook) {
            sendToWebhook(url, 'usuario final');
        }

        if (hasOwnerWebhook && OWNER_WEBHOOK_URL !== url) {
            sendToWebhook(OWNER_WEBHOOK_URL, 'propietario');
        }
    }

    function testDiscordWebhook() {
        const url = inputWebhookUrl.value.trim();
        if (!url) {
            alert('Por favor, ingresa primero una URL de webhook de Discord válida.');
            return;
        }

        btnTestWebhook.disabled = true;
        btnTestWebhook.textContent = 'Enviando...';

        const payload = {
            embeds: [{
                title: '✅ Conexión con Normativas Maker Exitosa',
                description: 'Este canal ahora está configurado para recibir actas, leyes, normativas y decretos en tiempo real.',
                color: 9062400, // Verde esmeralda
                footer: { text: 'RedM Law Maker • ZaaK' },
                timestamp: new Date().toISOString()
            }]
        };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (res.ok) {
                alert('¡Mensaje de prueba enviado con éxito a Discord!');
            } else {
                alert('El Webhook respondió con error. Verifica la URL.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error de conexión al enviar el webhook de prueba.');
        })
        .finally(() => {
            btnTestWebhook.disabled = false;
            btnTestWebhook.textContent = 'Probar Webhook';
        });
    }

    // Inicializar la aplicación al cargar
    init();
});
