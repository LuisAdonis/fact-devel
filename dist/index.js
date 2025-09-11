"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cors_config_1 = require("./config/cors.config");
const auth_1 = __importDefault(require("./routes/auth"));
const identificacion_1 = __importDefault(require("./routes/identificacion"));
const empresa_1 = __importDefault(require("./routes/empresa"));
const cliente_1 = __importDefault(require("./routes/cliente"));
const producto_1 = __importDefault(require("./routes/producto"));
const factura_1 = __importDefault(require("./routes/factura"));
const facturaDetalle_1 = __importDefault(require("./routes/facturaDetalle"));
const facturaPDF_1 = __importDefault(require("./routes/facturaPDF"));
const inventario_1 = __importDefault(require("./routes/inventario"));
const corsErrorHandler_1 = __importDefault(require("./middleware/corsErrorHandler"));
const path_1 = __importDefault(require("path"));
const swagger_1 = __importDefault(require("./swagger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const corsConfig = (0, cors_config_1.getCorsConfig)();
app.use((0, cors_1.default)(corsConfig));
app.use((req, res, next) => {
    // Logs para debgging
    // console.log(`📡 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No origin'}`);
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight request handled');
        res.status(200).end();
        return;
    }
    next();
});
app.use(express_1.default.json());
app.use(auth_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads/Empresa')));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads/Productos')));
const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <title>API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.18.3/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.18.3/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({ url: '/swagger.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`;
// Public routes for documentation
app.get('/swagger.json', (_req, res) => {
    res.json(swagger_1.default);
});
app.get('/docs', (_req, res) => {
    res.type('html').send(swaggerHtml);
});
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        cors: 'enabled',
        environment: process.env.NODE_ENV || 'development',
    });
});
// app.use(corsTestRoutes);
// app.use(verifyToken);
app.use('/api/v1/identificacion-tipo', identificacion_1.default);
app.use('/api/v1/empresa', empresa_1.default);
app.use('/api/v1/cliente', cliente_1.default);
app.use('/api/v1/factura-detalle', facturaDetalle_1.default);
app.use('/api/v1/factura', factura_1.default);
app.use('/api/v1/factura-pdf', facturaPDF_1.default);
app.use('/api/v1/producto', producto_1.default);
app.use('/api/v1/invetario', inventario_1.default);
app.use(corsErrorHandler_1.default);
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});
const PORT = process.env.PORT || 3000;
mongoose_1.default
    .connect(process.env.MONGODB_URI || '')
    .then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📄 API Docs: http://localhost:${PORT}/docs`);
    });
})
    .catch((err) => {
    console.error('❌ Database connection error', err);
});
