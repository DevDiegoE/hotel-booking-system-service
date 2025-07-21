import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { Express } from 'express';

dotenv.config();

const loadYamlFile = (filePath: string): any | null => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return yaml.load(fileContent);
    } catch (error) {
        console.error(`Error loading YAML file at ${filePath}:`, error);
        return null;
    }
};

const loadAndMergePathsAndDocsFromDirectory = (
    dirPath: string
): { mergedPaths: Record<string, any>; mergedComponents: { schemas: Record<string, any> } } => {
    const mergedPaths: Record<string, any> = {};
    const mergedComponents: { schemas: Record<string, any> } = { schemas: {} };

    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        if (file.endsWith('.yaml')) {
            const fullPath = path.join(dirPath, file);
            const yamlContent = loadYamlFile(fullPath);

            if (yamlContent?.paths && typeof yamlContent.paths === 'object') {
                Object.assign(mergedPaths, yamlContent.paths);
            }

            if (
                yamlContent?.components?.schemas &&
                typeof yamlContent.components.schemas === 'object'
            ) {
                Object.assign(mergedComponents.schemas, yamlContent.components.schemas);
            }
        }
    });

    return { mergedPaths, mergedComponents };
};

export const swaggerDocs = (app: Express): void => {
    const swaggerBasePath = path.resolve('src/infraestructure/express/docs/swagger.yaml');
    const swaggerBase = loadYamlFile(swaggerBasePath);

    if (!swaggerBase || typeof swaggerBase !== 'object') {
        console.error('Failed to load base swagger file: swagger.yaml');
        return;
    }

    const port = process.env.PORT || '3000';
    if (swaggerBase.servers) {
        swaggerBase.servers.forEach((server: any) => {
            server.url = server.url.replace('{$PORT}', port);
        });
    }

    const pathsDir = path.resolve('src/infraestructure/express/docs/paths');
    const { mergedPaths, mergedComponents } = loadAndMergePathsAndDocsFromDirectory(pathsDir);

    swaggerBase.paths = mergedPaths;
    swaggerBase.components = {
        ...(swaggerBase.components || {}),
        schemas: {
            ...(swaggerBase.components?.schemas || {}),
            ...mergedComponents.schemas,
        },
    };

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerBase));
    console.log(`Swagger docs available at http://localhost:${process.env.PORT || 3000}/api-docs`);
};
