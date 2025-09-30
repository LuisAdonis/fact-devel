import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { Model } from 'mongoose';

// Importar todos los modelos
import Usuario from '../models/Usuario';
import Empresa from '../models/Empresa';
import Caja from '../models/Caja';
import MovimientoCaja from '../models/MovimientoCaja';
import Cliente from '../models/Cliente';
import Factura from '../models/Factura';
import FacturaDetalle from '../models/FacturaDetalle';
import FacturaPago from '../models/FacturaPago';
import FacturaPDF from '../models/FacturaPDF';
import Producto from '../models/Producto';
import Inventario from '../models/Inventario';
import IdentificacionTipo from '../models/IdentificacionTipo';
import Permisos from '../models/Permisos';
import CierreCaja from '../models/CierreCajaModel';

const router = Router();

// Interfaz para los datos de respaldo
interface BackupData {
  timestamp: string;
  database_name: string;
  collections: {
    [key: string]: any[];
  };
  metadata: {
    total_documents: number;
    backup_type: 'full' | 'data_only' | 'complete_json';
    version: string;
    mongodb_version?: string;
  };
}

// Función auxiliar para hacer backup de una colección específica
async function backupCollection(model: Model<any>, collectionName: string): Promise<any[]> {
  try {
    const documents = await model.find({}).lean().exec();
    console.log(`✅ Backed up ${documents.length} documents from ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error);
    return [];
  }
}

// Función para obtener información de la base de datos
async function getDatabaseInfo(): Promise<any> {
  try {
    const mongoose = require('mongoose');
    const connection = mongoose.connection;

    if (connection.readyState === 1) {
      const admin = connection.db.admin();
      const buildInfo = await admin.buildInfo();

      return {
        mongodb_version: buildInfo.version,
        database_name: connection.name,
        host: connection.host,
        port: connection.port
      };
    }

    return {
      mongodb_version: 'unknown',
      database_name: process.env.DB_NAME || 'unknown',
      host: 'unknown',
      port: 'unknown'
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    return {
      mongodb_version: 'unknown',
      database_name: process.env.DB_NAME || 'unknown',
      host: 'unknown',
      port: 'unknown'
    };
  }
}

// Función para crear respaldo completo usando solo Mongoose
async function createCompleteBackup(): Promise<BackupData> {
  try {
    const timestamp = new Date().toISOString();
    const collections: { [key: string]: any[] } = {};
    let totalDocuments = 0;

    console.log('🚀 Iniciando respaldo completo...');

    // Hacer respaldo de cada colección individualmente
    collections.usuarios = await backupCollection(Usuario, 'usuarios');
    collections.empresas = await backupCollection(Empresa, 'empresas');
    collections.cajas = await backupCollection(Caja, 'cajas');
    collections.movimientos_caja = await backupCollection(MovimientoCaja, 'movimientos_caja');
    collections.clientes = await backupCollection(Cliente, 'clientes');
    collections.facturas = await backupCollection(Factura, 'facturas');
    collections.factura_detalles = await backupCollection(FacturaDetalle, 'factura_detalles');
    collections.factura_pagos = await backupCollection(FacturaPago, 'factura_pagos');
    collections.factura_pdfs = await backupCollection(FacturaPDF, 'factura_pdfs');
    collections.productos = await backupCollection(Producto, 'productos');
    collections.inventarios = await backupCollection(Inventario, 'inventarios');
    collections.identificacion_tipos = await backupCollection(IdentificacionTipo, 'identificacion_tipos');
    collections.permisos = await backupCollection(Permisos, 'permisos');
    collections.cierre_cajas = await backupCollection(CierreCaja, 'cierre_cajas');

    // Calcular total de documentos
    totalDocuments = Object.values(collections).reduce((sum, docs) => sum + docs.length, 0);

    // Obtener información de la base de datos
    const dbInfo = await getDatabaseInfo();

    const backupData: BackupData = {
      timestamp,
      database_name: dbInfo.database_name,
      collections,
      metadata: {
        total_documents: totalDocuments,
        backup_type: 'complete_json',
        version: '1.0.0',
        mongodb_version: dbInfo.mongodb_version
      }
    };

    console.log(`✅ Respaldo completo creado: ${totalDocuments} documentos`);
    return backupData;
  } catch (error) {
    console.error('Error creating complete backup:', error);
    throw error;
  }
}

// Función para crear archivo ZIP
async function createZipFile(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 ZIP file created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Función para comprimir JSON en ZIP
async function createJsonZip(jsonData: BackupData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 ZIP backup created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Agregar el archivo JSON principal
    const jsonString = JSON.stringify(jsonData, null, 2);
    archive.append(jsonString, { name: 'backup_data.json' });

    // Crear archivos separados por colección para facilitar la restauración
    for (const [collectionName, documents] of Object.entries(jsonData.collections)) {
      if (documents.length > 0) {
        const collectionJson = JSON.stringify(documents, null, 2);
        archive.append(collectionJson, { name: `collections/${collectionName}.json` });
      }
    }

    // Agregar archivo de metadatos
    const metadataJson = JSON.stringify({
      ...jsonData.metadata,
      timestamp: jsonData.timestamp,
      database_name: jsonData.database_name,
      backup_created_at: new Date().toISOString(),
      collections_summary: Object.keys(jsonData.collections).map(name => ({
        name,
        count: jsonData.collections[name].length
      }))
    }, null, 2);

    archive.append(metadataJson, { name: 'metadata.json' });

    archive.finalize();
  });
}

// Endpoint para crear respaldo completo (usando solo Mongoose)
router.post('/backup/full', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Crear directorio de respaldos si no existe
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Crear respaldo completo
    const backupData = await createCompleteBackup();

    // Crear archivo ZIP comprimido
    const zipPath = path.join(backupsDir, `full_backup_${timestamp}.zip`);
    await createJsonZip(backupData, zipPath);

    // Información del archivo creado
    const stats = fs.statSync(zipPath);

    res.json({
      success: true,
      message: 'Respaldo completo creado exitosamente',
      backup_info: {
        filename: path.basename(zipPath),
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / (1024 * 1024) * 100) / 100,
        timestamp,
        type: 'full_backup',
        total_documents: backupData.metadata.total_documents,
        collections: Object.keys(backupData.collections).map(name => ({
          name,
          count: backupData.collections[name].length
        })),
        mongodb_version: backupData.metadata.mongodb_version
      }
    });

  } catch (error: any) {
    console.error('Error creating full backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear respaldo completo',
      error: error.message
    });
  }
});
// Endpoint para respaldo de datos únicamente (JSON)
router.post('/backup/data', async (req: Request, res: Response) => {
  try {
    const backupData = await createCompleteBackup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Crear directorio de respaldos si no existe
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Guardar respaldo como JSON
    const backupPath = path.join(backupsDir, `data_backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    // Información del archivo creado
    const stats = fs.statSync(backupPath);

    res.json({
      success: true,
      message: 'Respaldo de datos creado exitosamente',
      backup_info: {
        filename: path.basename(backupPath),
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / (1024 * 1024) * 100) / 100,
        timestamp: backupData.timestamp,
        type: 'data_only',
        total_documents: backupData.metadata.total_documents,
        collections: Object.keys(backupData.collections).map(name => ({
          name,
          count: backupData.collections[name].length
        }))
      }
    });

  } catch (error: any) {
    console.error('Error creating data backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear respaldo de datos',
      error: error.message
    });
  }
});
// Endpoint para descargar respaldo completo
router.get('/backup/full/download/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de respaldo no encontrado'
      });
    }

    const stats = fs.statSync(backupPath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    const fileStream = fs.createReadStream(backupPath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar respaldo',
      error: error.message
    });
  }
});

// Endpoint para descargar respaldo de datos
router.get('/backup/data/download/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de respaldo no encontrado'
      });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.zip' ? 'application/zip' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(backupPath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('Error downloading data backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar respaldo',
      error: error.message
    });
  }
});
// Endpoint para listar respaldos disponibles
router.get('/backup/list', (req: Request, res: Response) => {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupsDir)) {
      return res.json(
);
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files.map(filename => {
      const filePath = path.join(backupsDir, filename);
      const stats = fs.statSync(filePath);

      let type = 'unknown';
      if (filename.includes('full_backup')) type = 'full';
      else if (filename.includes('data_backup')) type = 'data_only';

      return {
        filename,
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / (1024 * 1024) * 100) / 100,
        created_at: stats.birthtime,
        modified_at: stats.mtime,
        type,
        extension: path.extname(filename),
        is_compressed: path.extname(filename) === '.zip'
      };
    }).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    // res.json({
    //   success: true,
    //   backups,
    //   total_count: backups.length,
    //   total_size_mb: Math.round(backups.reduce((sum, backup) => sum + backup.size_mb, 0) * 100) / 100
    // });

    res.json(
      backups,
    );
  } catch (error: any) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar respaldos',
      error: error.message
    });
  }
});
// Endpoint para eliminar respaldo
router.delete('/backup/:filename',async(req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', filename);
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido'
      });
    }

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de respaldo no encontrado'
      });
    }

    await fs.promises.unlink(backupPath);

    res.json({
      success: true,
      message: 'Respaldo eliminado exitosamente',
      deleted_file: filename
    });

  } catch (error: any) {
      console.error('Error deleting backup:', error);
    
    let mensaje = 'Error al eliminar respaldo';
    if (error.code === 'EPERM') {
      mensaje = 'Permiso denegado. El archivo puede estar en uso o necesitas ejecutar como administrador.';
    }

    res.status(500).json({
      success: false,
      message: mensaje,
      error: error.message
    });
  }
});

// Endpoint para obtener estadísticas de la base de datos
router.get('/backup/stats', async (req: Request, res: Response) => {
  try {
    const stats: any = {};
    let totalDocuments = 0;

    // Obtener estadísticas de cada colección
    const collections = {
      usuarios: Usuario,
      empresas: Empresa,
      cajas: Caja,
      movimientos_caja: MovimientoCaja,
      clientes: Cliente,
      facturas: Factura,
      factura_detalles: FacturaDetalle,
      factura_pagos: FacturaPago,
      factura_pdfs: FacturaPDF,
      productos: Producto,
      inventarios: Inventario,
      identificacion_tipos: IdentificacionTipo,
      permisos: Permisos,
      cierre_cajas: CierreCaja
    };

    for (const [name, model] of Object.entries(collections)) {
      try {
        const count = await model.estimatedDocumentCount();
        stats[name] = count;
        totalDocuments += count;
      } catch (error) {
        stats[name] = 0;
      }
    }

    const dbInfo = await getDatabaseInfo();

    res.json({
      success: true,
      database_info: dbInfo,
      collection_stats: stats,
      total_documents: totalDocuments,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

export default router;