function filterBorrows(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll('#borrowsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}