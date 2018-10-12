/**
 * Created by burakcan.timucin on 29.8.2017.
 */


html = "";
obj = {
    "1" : "Name",
    "2": "Age",
    "3" : "Gender"
}
for(var key in obj) {
    html += "<option value=" + key  + ">" +obj[key] + "</option>"
}
document.getElementById("datas").innerHTML = html;