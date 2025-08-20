// Services data with default values
let servicesData = {
    'reparo': { name: 'Reparo', fora: 2500, dentro: 1500 },
    'kit-avancado': { name: 'Kit Avançado', fora: 3500, dentro: 2500 },
    'kit-basico': { name: 'Kit Básico', fora: 2000, dentro: 1000 },
    'turbo': { name: 'Turbo', fora: null, dentro: 80000 },
    'chave-inglesa': { name: 'Chave Inglesa', fora: 800, dentro: 600 },
    'pneu': { name: 'Pneu', fora: 500, dentro: 200 }
};

// DOM elements
const currentDateElement = document.getElementById('current-date');
const servicesTableBody = document.getElementById('services-table-body');
const servicesCheckboxes = document.getElementById('services-checkboxes');
const locationSelect = document.getElementById('location-select');
const extraServicesInput = document.getElementById('extra-services');
const elevatorTaxInput = document.getElementById('elevator-tax');
const discountInput = document.getElementById('discount-input');
const applyElevatorTaxCheckbox = document.getElementById('apply-elevator-tax');
const calculateBtn = document.getElementById('calculate-btn');
const clearBtn = document.getElementById('clear-btn');
const resultDisplay = document.getElementById('result-display');
const resultValue = document.getElementById('result-value');
const servicesCount = document.getElementById('services-count');
const summaryBtn = document.getElementById('summary-btn');
const summaryModal = document.getElementById('summary-modal');
const summaryDetails = document.getElementById('summary-details');
const closeModal = document.getElementById('close-modal');
const closeSummary = document.getElementById('close-summary');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setCurrentDate();
    populateServicesTable();
    populateServicesCheckboxes();
    setupEventListeners();
}

function setCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDateElement.textContent = now.toLocaleDateString('pt-BR', options);
}

function populateServicesTable() {
    servicesTableBody.innerHTML = '';
    
    Object.keys(servicesData).forEach(serviceKey => {
        const service = servicesData[serviceKey];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="service-name">${service.name}</td>
            <td>
                ${service.fora !== null ? 
                    `<input type="number" class="price-input" data-service="${serviceKey}" data-location="fora" value="${service.fora}" min="0">` : 
                    '<span style="color: #666;">N/A</span>'
                }
            </td>
            <td>
                <input type="number" class="price-input" data-service="${serviceKey}" data-location="dentro" value="${service.dentro}" min="0">
            </td>
        `;
        
        servicesTableBody.appendChild(row);
    });
    
    // Add event listeners for price inputs
    document.querySelectorAll('.price-input').forEach(input => {
        input.addEventListener('change', function() {
            const serviceKey = this.dataset.service;
            const location = this.dataset.location;
            const value = parseInt(this.value) || 0;
            servicesData[serviceKey][location] = value;
        });
    });
}

function populateServicesCheckboxes() {
    servicesCheckboxes.innerHTML = '';
    
    Object.keys(servicesData).forEach(serviceKey => {
        const service = servicesData[serviceKey];
        
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-checkbox-item';
        
        serviceItem.innerHTML = `
            <div class="service-checkbox-left">
                <label class="service-checkbox-label">
                    <input type="checkbox" data-service="${serviceKey}">
                    <span class="service-checkmark"></span>
                    ${service.name}
                </label>
            </div>
            <input type="number" class="service-quantity-input" data-service="${serviceKey}" min="1" value="1" disabled>
        `;
        
        servicesCheckboxes.appendChild(serviceItem);
    });
    
    // Add event listeners for checkboxes and quantity inputs
    servicesCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const serviceKey = this.dataset.service;
            const quantityInput = servicesCheckboxes.querySelector(`input[type="number"][data-service="${serviceKey}"]`);
            quantityInput.disabled = !this.checked;
            autoCalculate();
        });
    });
    
    servicesCheckboxes.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', autoCalculate);
    });
}

function setupEventListeners() {
    calculateBtn.addEventListener('click', calculateTotal);
    clearBtn.addEventListener('click', clearCalculation);
    summaryBtn.addEventListener('click', showSummary);
    closeModal.addEventListener('click', closeSummaryModal);
    closeSummary.addEventListener('click', closeSummaryModal);
    
    // Close modal when clicking outside
    summaryModal.addEventListener('click', function(e) {
        if (e.target === summaryModal) {
            closeSummaryModal();
        }
    });
    
    // Enable/disable elevator tax input based on checkbox
    applyElevatorTaxCheckbox.addEventListener('change', function() {
        elevatorTaxInput.disabled = !this.checked;
        if (!this.checked) {
            elevatorTaxInput.style.opacity = '0.5';
        } else {
            elevatorTaxInput.style.opacity = '1';
        }
    });
    
    // Auto-calculate on input change
    [locationSelect, extraServicesInput, elevatorTaxInput, discountInput, applyElevatorTaxCheckbox].forEach(element => {
        element.addEventListener('change', autoCalculate);
    });
}

function autoCalculate() {
    const selectedCheckboxes = servicesCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    if (selectedCheckboxes.length > 0 || parseFloat(extraServicesInput.value) > 0) {
        calculateTotal();
    }
}

function calculateTotal() {
    const selectedCheckboxes = servicesCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    const location = locationSelect.value;
    const extraServices = parseFloat(extraServicesInput.value) || 0;
    const elevatorTax = parseFloat(elevatorTaxInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;
    const applyElevatorTax = applyElevatorTaxCheckbox.checked;
    
    if (selectedCheckboxes.length === 0 && extraServices === 0) {
        showError('Por favor, selecione pelo menos um serviço ou adicione um valor extra.');
        return;
    }
    
    let total = 0;
    let servicesDetails = [];
    let unavailableServices = [];
    let totalQuantity = 0;
    
    // Calculate selected services
    selectedCheckboxes.forEach(checkbox => {
        const serviceKey = checkbox.dataset.service;
        const service = servicesData[serviceKey];
        const quantityInput = servicesCheckboxes.querySelector(`input[type="number"][data-service="${serviceKey}"]`);
        const quantity = parseInt(quantityInput.value) || 1;
        const unitPrice = service[location];
        
        if (quantity <= 0) {
            showError(`Por favor, informe uma quantidade válida para ${service.name}.`);
            return;
        }
        
        if (unitPrice === null || unitPrice === undefined) {
            unavailableServices.push(service.name);
        } else {
            const serviceTotal = unitPrice * quantity;
            total += serviceTotal;
            totalQuantity += quantity;
            servicesDetails.push({
                name: service.name,
                unitPrice: unitPrice,
                quantity: quantity,
                total: serviceTotal
            });
        }
    });
    
    // Add extra services
    if (extraServices > 0) {
        const extraTotal = extraServices;
        total += extraTotal;
        servicesDetails.push({
            name: 'Serviços Extras',
            unitPrice: extraServices,
            quantity: 1,
            total: extraTotal
        });
    }
    
    if (unavailableServices.length > 0) {
        showError(`Os seguintes serviços não estão disponíveis no local selecionado: ${unavailableServices.join(', ')}`);
        return;
    }
    
    if (total === 0) {
        showError('Nenhum serviço válido foi selecionado.');
        return;
    }
    
    const baseTotal = total;
    
    // Apply elevator tax if checked and selected
    if (applyElevatorTax && elevatorTax > 0) {
        total += (total * elevatorTax / 100);
    }
    
    // Apply discount
    if (discount > 0) {
        total -= (total * discount / 100);
    }
    
    // Display result
    resultValue.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Display services count
    const totalServices = servicesDetails.length;
    servicesCount.textContent = `${totalServices} serviço${totalServices !== 1 ? 's' : ''} selecionado${totalServices !== 1 ? 's' : ''}`;
    
    resultDisplay.classList.remove('hidden');
    
    // Store calculation data for summary
    resultDisplay.dataset.calculationData = JSON.stringify({
        services: servicesDetails,
        location: location === 'fora' ? 'Fora da Oficina' : 'Dentro da Oficina',
        baseTotal: baseTotal,
        extraServices: extraServices,
        elevatorTax: applyElevatorTax ? elevatorTax : 0,
        discount: discount,
        total: total
    });
    
    // Add success animation
    resultDisplay.style.animation = 'none';
    resultDisplay.offsetHeight; // Trigger reflow
    resultDisplay.style.animation = 'glow 2s ease-in-out infinite alternate';
}

function showError(message) {
    resultDisplay.classList.remove('hidden');
    resultValue.textContent = message;
    resultValue.style.color = '#ff4757';
    resultDisplay.style.borderColor = '#ff4757';
    resultDisplay.style.background = 'rgba(255, 71, 87, 0.1)';
    
    // Reset after 3 seconds
    setTimeout(() => {
        resultValue.style.color = '#ffffff';
        resultDisplay.style.borderColor = '#00ff41';
        resultDisplay.style.background = 'rgba(0, 255, 65, 0.1)';
    }, 3000);
}

function clearCalculation() {
    // Clear all selections
    servicesCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    servicesCheckboxes.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '1';
        input.disabled = true;
    });
    locationSelect.value = 'fora';
    extraServicesInput.value = '0';
    elevatorTaxInput.value = '30';
    discountInput.value = '0';
    applyElevatorTaxCheckbox.checked = false;
    elevatorTaxInput.disabled = true;
    elevatorTaxInput.style.opacity = '0.5';
    resultDisplay.classList.add('hidden');
    
    // Reset result display styles
    resultValue.style.color = '#ffffff';
    resultDisplay.style.borderColor = '#00ff41';
    resultDisplay.style.background = 'rgba(0, 255, 65, 0.1)';
}

function showSummary() {
    const calculationData = JSON.parse(resultDisplay.dataset.calculationData || '{}');
    
    if (!calculationData.services || calculationData.services.length === 0) {
        showError('Nenhum cálculo encontrado para exibir resumo.');
        return;
    }
    
    const baseTotal = calculationData.baseTotal;
    const elevatorTaxAmount = calculationData.elevatorTax > 0 ? (baseTotal * calculationData.elevatorTax / 100) : 0;
    const subtotalWithTax = baseTotal + elevatorTaxAmount;
    const discountAmount = calculationData.discount > 0 ? (subtotalWithTax * calculationData.discount / 100) : 0;
    
    let servicesHtml = '';
    calculationData.services.forEach(service => {
        servicesHtml += `
            <div class="summary-item">
                <span class="summary-label">${service.name}:</span>
                <span class="summary-value">${service.quantity}x R$ ${service.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = R$ ${service.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
        `;
    });
    
    summaryDetails.innerHTML = `
        <div class="summary-section">
            <h4 style="color: #00ff41; margin-bottom: 15px; font-size: 1.2rem;">SERVIÇOS SELECIONADOS:</h4>
            ${servicesHtml}
        </div>
        <div class="summary-item">
            <span class="summary-label">Local:</span>
            <span class="summary-value">${calculationData.location}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Subtotal:</span>
            <span class="summary-value">R$ ${baseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        ${calculationData.elevatorTax > 0 ? `
        <div class="summary-item">
            <span class="summary-label">Taxa Elevador (${calculationData.elevatorTax}%):</span>
            <span class="summary-value">+ R$ ${elevatorTaxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        ${calculationData.discount > 0 ? `
        <div class="summary-item">
            <span class="summary-label">Desconto (${calculationData.discount}%):</span>
            <span class="summary-value">- R$ ${discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        <div class="summary-item">
            <span class="summary-label">TOTAL FINAL:</span>
            <span class="summary-value">R$ ${calculationData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
    `;
    
    summaryModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSummaryModal() {
    summaryModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !summaryModal.classList.contains('hidden')) {
        closeSummaryModal();
    }
    
    if (e.key === 'Enter' && !summaryModal.classList.contains('hidden')) {
        e.preventDefault();
        closeSummaryModal();
    }
    
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        calculateTotal();
    }
});

// Initialize elevator tax input state
document.addEventListener('DOMContentLoaded', function() {
    elevatorTaxInput.disabled = true;
    elevatorTaxInput.style.opacity = '0.5';
});