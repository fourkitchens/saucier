/*

███████╗ █████╗ ██╗   ██╗ ██████╗██╗███████╗██████╗
██╔════╝██╔══██╗██║   ██║██╔════╝██║██╔════╝██╔══██╗
███████╗███████║██║   ██║██║     ██║█████╗  ██████╔╝
╚════██║██╔══██║██║   ██║██║     ██║██╔══╝  ██╔══██╗
███████║██║  ██║╚██████╔╝╚██████╗██║███████╗██║  ██║
╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝╚══════╝╚═╝  ╚═╝

*/

var dust            = require('./public/templates/views'),
    configs         = require('./lib/config'),
    saucier         = require('./lib/headless')(dust, configs.getServerConfigs()),
    routesWeb       = require('./routes/web')(saucier);

saucier.start();
