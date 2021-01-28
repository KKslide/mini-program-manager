export default function (Vue) {
    /* 常规数字或字符串 */
    Vue.filter('date', tplDate => {
        let date = typeof tplDate == "number"
            ? new Date(tplDate)
            : new Date(tplDate + '');
        return ` ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()}:${date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()} `;
    });
    /* 科学计数法 */
    Vue.filter('numberDouble', tplDate => {
        if (tplDate == null || tplDate == undefined) return "";
        let date = new Date(Number(tplDate));
        return ` ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()}:${date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()} `;
    })
};