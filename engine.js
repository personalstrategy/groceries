// Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        // Enable offline persistence
        db.enablePersistence()
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code == 'unimplemented') {
                    console.log('The current browser does not support offline persistence');
                }
            });
        
        // References
        const itemsRef = db.collection('groceries');
        const listEl = document.getElementById('list');
        const newItemInput = document.getElementById('newItem');
        const offlineIndicator = document.getElementById('offlineIndicator');
        
        // Track items
        let items = new Map();
        
        // Listen for real-time updates
        itemsRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const doc = change.doc;
                const data = { id: doc.id, ...doc.data() };
                
                if (change.type === 'added') {
                    items.set(doc.id, data);
                    if (!document.getElementById(doc.id)) {
                        addItemToDOM(data);
                    }
                } else if (change.type === 'modified') {
                    items.set(doc.id, data);
                    updateItemInDOM(data);
                } else if (change.type === 'removed') {
                    items.delete(doc.id);
                    removeItemFromDOM(doc.id);
                }
            });
            
            updateEmptyState();
        }, (error) => {
            console.error('Error listening to changes:', error);
        });
        
        // Add item
        function addItem() {
            const text = newItemInput.value.trim();
            if (!text) return;
            
            itemsRef.add({
                text: text,
                done: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                newItemInput.value = '';
                // Keep focus on input for rapid entry
                newItemInput.focus();
            }).catch((error) => {
                console.error('Error adding item:', error);
                alert('Failed to add item. Please try again.');
            });
        }
        
        // Toggle item done status
        function toggleItem(id) {
            const item = items.get(id);
            if (item) {
                itemsRef.doc(id).update({
                    done: !item.done
                }).catch((error) => {
                    console.error('Error toggling item:', error);
                });
            }
        }
        
        // Delete item
        function deleteItem(id) {
            itemsRef.doc(id).delete().catch((error) => {
                console.error('Error deleting item:', error);
                alert('Failed to delete item. Please try again.');
            });
        }
        
        // DOM manipulation functions
        function addItemToDOM(item) {
            const itemEl = document.createElement('div');
            itemEl.className = `item ${item.done ? 'done' : ''}`;
            itemEl.id = item.id;
            itemEl.innerHTML = `
                <div class="item-content">
                    <div class="checkbox" onclick="toggleItem('${item.id}')"></div>
                    <div class="item-text">${escapeHtml(item.text)}</div>
                    <button class="delete-btn" onclick="deleteItem('${item.id}')" title="Delete">
                        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g transform="translate(-27.5, -1)" fill="currentColor" fill-rule="nonzero">
                                    <path d="M147.112511,343.727844 C150.963219,343.727844 154.055871,342.602661 156.390465,340.352295 C158.72506,338.101929 159.822777,335.179565 159.683617,331.585205 L154.058617,140.390137 C154.016503,136.700562 152.817162,133.789185 150.460595,131.656006 C148.104027,129.522827 145.080956,128.456238 141.391381,128.456238 C137.489403,128.456238 134.399956,129.552124 132.12304,131.743896 C129.846123,133.935669 128.777245,136.876343 128.916405,140.565918 L134.222802,331.651123 C134.457177,335.340698 135.723351,338.275879 138.021325,340.456665 C140.319298,342.637451 143.349694,343.727844 147.112511,343.727844 Z M201.01693,343.727844 C204.874962,343.727844 207.995537,342.642487 210.378655,340.471771 C212.761773,338.301056 213.953331,335.370911 213.953331,331.681335 L213.953331,140.5 C213.953331,136.810425 212.761773,133.880737 210.378655,131.710938 C207.995537,129.541138 204.874962,128.456238 201.01693,128.456238 C197.230309,128.456238 194.145897,129.541138 191.763695,131.710938 C189.381493,133.880737 188.190392,136.810425 188.190392,140.5 L188.190392,331.681335 C188.190392,335.370911 189.381493,338.301056 191.763695,340.471771 C194.145897,342.642487 197.230309,343.727844 201.01693,343.727844 Z M255.031212,343.727844 C258.79403,343.727844 261.824425,342.661255 264.122399,340.528076 C266.420372,338.394897 267.638939,335.435913 267.7781,331.651123 L273.084496,140.565918 C273.221825,136.876343 272.152489,133.935669 269.876488,131.743896 C267.600487,129.552124 264.511498,128.456238 260.60952,128.456238 C257.01516,128.456238 254.039696,129.522827 251.683129,131.656006 C249.326561,133.789185 248.078698,136.748169 247.939538,140.532959 L242.460106,331.585205 C242.342919,335.27478 243.427819,338.220947 245.714806,340.423706 C248.001793,342.626465 251.107262,343.727844 255.031212,343.727844 Z M121.107872,82.390564 L121.107872,44.270752 C121.107872,30.8839111 125.197991,20.4102783 133.378228,12.8498535 C141.558465,5.28942871 152.913292,1.50921631 167.442711,1.50921631 L234.269799,1.50921631 C248.799218,1.50921631 260.154046,5.28942871 268.334282,12.8498535 C276.514519,20.4102783 280.604638,30.8839111 280.604638,44.270752 L280.604638,82.390564 L248.079613,82.390564 L248.079613,45.8994751 C248.079613,41.4298706 246.612938,37.8272705 243.679589,35.0916748 C240.746239,32.3560791 236.836937,30.9882812 231.951684,30.9882812 L169.763573,30.9882812 C164.876488,30.9882812 160.966729,32.3560791 158.034295,35.0916748 C155.101861,37.8272705 153.635643,41.4298706 153.635643,45.8994751 L153.635643,82.390564 L121.107872,82.390564 Z M43.2697377,101.608398 C39.0015492,101.608398 35.3344045,100.101898 32.2683034,97.0888977 C29.2022023,94.0758972 27.6691518,90.3876953 27.6691518,86.024292 C27.6691518,81.7780762 29.2022023,78.1539612 32.2683034,75.151947 C35.3344045,72.1499329 39.0015492,70.6489258 43.2697377,70.6489258 L358.873986,70.6489258 C363.142174,70.6489258 366.785515,72.1261292 369.804009,75.0805359 C372.822503,78.0349426 374.331749,81.6828613 374.331749,86.024292 C374.331749,90.3876953 372.846306,94.0758972 369.87542,97.0888977 C366.904534,100.101898 363.237389,101.608398 358.873986,101.608398 L43.2697377,101.608398 Z M120.283898,398.26123 C106.74508,398.26123 95.8965383,394.432953 87.7382741,386.776398 C79.5800099,379.119843 75.1978383,368.512085 74.5917592,354.953125 L62.3694692,97.9499512 L339.631432,97.9499512 L327.551964,354.810303 C326.944054,368.369263 322.537163,379.000824 314.331292,386.704987 C306.12542,394.409149 295.301598,398.26123 281.859826,398.26123 L120.283898,398.26123 Z"></path>
                                </g>
                            </g>
                        </svg>
                    </button>
                </div>
            `;
            
            // Always insert at the top of the list (after empty state if present)
            const firstItem = listEl.querySelector('.item');
            if (firstItem) {
                listEl.insertBefore(itemEl, firstItem);
            } else {
                listEl.appendChild(itemEl);
            }
        }
        
        function updateItemInDOM(item) {
            const itemEl = document.getElementById(item.id);
            if (itemEl) {
                itemEl.className = `item ${item.done ? 'done' : ''}`;
            }
        }
        
        function removeItemFromDOM(id) {
            const itemEl = document.getElementById(id);
            if (itemEl) {
                itemEl.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => itemEl.remove(), 300);
            }
        }
        
        function updateEmptyState() {
            const hasItems = listEl.querySelector('.item');
            const emptyState = listEl.querySelector('.empty-state');
            
            if (!hasItems && !emptyState) {
                listEl.innerHTML = '<div class="empty-state">Your grocery list is empty</div>';
            } else if (hasItems && emptyState) {
                emptyState.remove();
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Handle enter key
        newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
            }
        });
        
        // Auto-focus on load
        window.addEventListener('load', () => {
            newItemInput.focus();
        });
        
        // Online/offline detection
        window.addEventListener('online', () => {
            offlineIndicator.style.display = 'none';
        });
        
        window.addEventListener('offline', () => {
            offlineIndicator.style.display = 'block';
        });
        
        // PWA Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered'))
                    .catch(err => console.log('Service Worker registration failed'));
            });
        }