// file.js

// Load data from localStorage
let lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
let foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];

// DOM references
const reportModal = document.getElementById('reportModal');
const reportForm = document.getElementById('reportForm');
const modalTitle = document.getElementById('modalTitle');
const reportLostBtn = document.getElementById('reportLostBtn');
const reportFoundBtn = document.getElementById('reportFoundBtn');
const closeModal = document.getElementById('closeModal');
const lostItemsList = document.getElementById('lostItemsList');
const foundItemsList = document.getElementById('foundItemsList');

let currentReportType = '';

// Event Listeners
reportLostBtn.addEventListener('click', () => openModal('lost'));
reportFoundBtn.addEventListener('click', () => openModal('found'));
closeModal.addEventListener('click', () => reportModal.classList.add('hidden'));
reportForm.addEventListener('submit', handleSubmit);

document.getElementById('viewLostBtn').addEventListener('click', () => {
  window.scrollTo({ top: lostItemsList.offsetTop - 100, behavior: 'smooth' });
});

document.getElementById('viewFoundBtn').addEventListener('click', () => {
  window.scrollTo({ top: foundItemsList.offsetTop - 100, behavior: 'smooth' });
});

document.getElementById('searchLost').addEventListener('input', (e) => {
  updateItemsDisplay(e.target.value.toLowerCase(), document.getElementById('searchFound').value.toLowerCase());
});

document.getElementById('searchFound').addEventListener('input', (e) => {
  updateItemsDisplay(document.getElementById('searchLost').value.toLowerCase(), e.target.value.toLowerCase());
});

// Modal control
function openModal(type) {
  currentReportType = type;
  modalTitle.textContent = `Report ${type.charAt(0).toUpperCase() + type.slice(1)} Item`;
  reportModal.classList.remove('hidden');
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();

  const fileInput = document.getElementById('itemImage');
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload an image.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const base64Image = event.target.result;

    const item = {
      reporterName: document.getElementById('reporterName').value,
      description: document.getElementById('itemDescription').value,
      location: document.getElementById('location').value,
      contact: document.getElementById('contactInfo').value,
      image: base64Image,
      timestamp: new Date().toISOString(),
      isMatched: false,
      resolved: false
    };

    if (!item.reporterName || !item.description || !item.location || !item.contact) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    if (currentReportType === 'lost') {
      lostItems.push(item);
      localStorage.setItem('lostItems', JSON.stringify(lostItems));
    } else {
      foundItems.push(item);
      localStorage.setItem('foundItems', JSON.stringify(foundItems));
    }

    reportForm.reset();
    fileInput.value = '';
    reportModal.classList.add('hidden');
    updateItemsDisplay();
    matchItems();
  };

  reader.readAsDataURL(file);
}

// Update items list on screen
function updateItemsDisplay(lostFilter = '', foundFilter = '') {
  lostItemsList.innerHTML = '';
  foundItemsList.innerHTML = '';

  lostItems
    .filter(item => !item.isMatched && item.description.toLowerCase().includes(lostFilter))
    .forEach((item, index) => lostItemsList.appendChild(createItemCard(item, 'lost', index)));

  foundItems
    .filter(item => !item.isMatched && item.description.toLowerCase().includes(foundFilter))
    .forEach((item, index) => foundItemsList.appendChild(createItemCard(item, 'found', index)));
}

// Create item card dynamically
function createItemCard(item, type, index) {
  const card = document.createElement('div');
  card.className = `border rounded-lg p-4 hover:shadow-md transition-shadow ${item.resolved ? 'opacity-50' : ''}`;

  const iconClass = type === 'lost' ? 'fa-search text-red-500' : 'fa-hand-holding text-green-500';
  const date = new Date(item.timestamp).toLocaleDateString();

  card.innerHTML = `
    <div class="flex items-start space-x-4">
      <div class="flex-1">
        <div class="flex items-center">
          <i class="fas ${iconClass} mr-2"></i>
          <h3 class="font-medium text-gray-900">${item.description}</h3>
        </div>
        <p class="text-sm text-gray-500 mt-1">Location: ${item.location}</p>
        <p class="text-sm text-gray-500">Reported by: ${item.reporterName}</p>
        <p class="text-sm text-gray-500">Contact: ${item.contact}</p>
        <p class="text-sm text-gray-500">Date: ${date}</p>
        <div class="mt-3 flex items-center space-x-4">
          <label class="flex items-center space-x-2 text-sm">
            <input type="checkbox" ${item.resolved ? 'checked' : ''} />
            <span>Mark as Resolved</span>
          </label>
          <button class="text-red-500 hover:underline text-sm">Delete</button>
        </div>
      </div>
      ${item.image ? `<img src="${item.image}" alt="Item image" class="w-20 h-20 object-cover rounded-md border">` : ''}
    </div>
  `;

  // Event listeners for resolve and delete
  const checkbox = card.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => toggleResolved(type, index));

  const deleteBtn = card.querySelector('button');
  deleteBtn.addEventListener('click', () => deleteItem(type, index));

  return card;
}

// Toggle item resolution
function toggleResolved(type, index) {
  if (type === 'lost') {
    lostItems[index].resolved = !lostItems[index].resolved;
    localStorage.setItem('lostItems', JSON.stringify(lostItems));
  } else {
    foundItems[index].resolved = !foundItems[index].resolved;
    localStorage.setItem('foundItems', JSON.stringify(foundItems));
  }
  updateItemsDisplay();
}

// Delete an item
function deleteItem(type, index) {
  if (type === 'lost') {
    lostItems.splice(index, 1);
    localStorage.setItem('lostItems', JSON.stringify(lostItems));
  } else {
    foundItems.splice(index, 1);
    localStorage.setItem('foundItems', JSON.stringify(foundItems));
  }
  updateItemsDisplay();
}

// Attempt to match lost and found items based on keyword similarity
function matchItems() {
  lostItems.forEach((lostItem, lostIndex) => {
    if (lostItem.isMatched || lostItem.resolved) return;

    foundItems.forEach((foundItem, foundIndex) => {
      if (foundItem.isMatched || foundItem.resolved) return;

      const lostWords = lostItem.description.toLowerCase().split(' ');
      const foundWords = foundItem.description.toLowerCase().split(' ');

      const commonWords = lostWords.filter(word => word.length > 3 && foundWords.includes(word));

      if (commonWords.length > 0) {
        lostItems[lostIndex].isMatched = true;
        foundItems[foundIndex].isMatched = true;

        showMatchNotification(lostItem, foundItem);

        localStorage.setItem('lostItems', JSON.stringify(lostItems));
        localStorage.setItem('foundItems', JSON.stringify(foundItems));
      }
    });
  });

  updateItemsDisplay();
}

// Show a floating notification for matches
function showMatchNotification(lostItem, foundItem) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <h4 class="font-semibold">Match Found!</h4>
    <p class="text-sm">Lost: ${lostItem.description}</p>
    <p class="text-sm">Found: ${foundItem.description}</p>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Initial load
updateItemsDisplay();
