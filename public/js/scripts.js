document.querySelector('button').addEventListener('click', async () => {
    const searchDescription = document.querySelector('input[name="search"]').value;
    
    // Show the loading indicator
    document.getElementById('loading-indicator').style.display = 'block';

    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ search: searchDescription })
        });

        const filteredProducts = await response.json();

        // Render the filteredProducts on the page
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Error:', error);
        // Optionally, handle the error with a user-friendly message
    } finally {
        // Hide the loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
    }
});

  function renderProducts(products) {
    const tableBody = document.getElementById('product-list');
    let newContent = '';

    products.forEach(product => {
        newContent += `
            <tr>
                <td>${product.id}</td>
                <td>${product.type}</td>
                <td>${product.name}</td>
                <td>${product.price}</td>
                <td>${product.description}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = newContent;
}
