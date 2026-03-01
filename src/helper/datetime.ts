//class for date time to store date insertion of data in database

function getUTCdate() {
    let date = new Date().toUTCString();
    return date;
}


export { getUTCdate };
