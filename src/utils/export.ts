export function convertToCSV(objArray: any[]) {
    if (!objArray || objArray.length === 0) {
        return '';
    }
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    // Header
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';

    // Rows
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (const index in array[i]) {
            if (line !== '') line += ',';

            // Handle potential strings with commas by wrapping in quotes
            let value = array[i][index];
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            } else if (value === null || value === undefined) {
                value = '';
            }
            line += value;
        }
        str += line + '\r\n';
    }
    return str;
}

export function downloadCSV(data: any[], filename: string) {
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
