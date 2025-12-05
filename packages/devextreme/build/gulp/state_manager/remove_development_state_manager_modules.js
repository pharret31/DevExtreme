'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const {
    STATE_MANAGER_FOLDER_PATH,
    STATE_MANAGER_INDEX_MODULE_PATH,
    STATE_MANAGER_PROD_FOLDER_PATH
} = require('./constants');
const ctx = require('../context');

const MODULE_TYPES = ['esm', 'cjs'];

const removeDevelopmentStateManagerModules = (targetPath) => {
    MODULE_TYPES.forEach(type => {
        const stateManagerPath = path.join(targetPath, type, STATE_MANAGER_FOLDER_PATH);

        if (fs.existsSync(stateManagerPath)) {
            const items = fs.readdirSync(stateManagerPath);
            items.forEach(item => {
                const itemPath = path.join(stateManagerPath, item);
                if (item !== 'prod' && item !== 'index.js') {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                }
            });
        }
    });
}

const createRemoveDevelopmentStateManagerModulesTask = (targetPath) => (done) => {
    removeDevelopmentStateManagerModules(targetPath);
    done();
};

gulp.task('state-manager-remove-development-only-modules-transpiled-prod-esm', createRemoveDevelopmentStateManagerModulesTask(ctx.TRANSPILED_PROD_ESM_PATH));

gulp.task('state-manager-remove-development-only-modules-transpiled-prod-renovation', createRemoveDevelopmentStateManagerModulesTask(ctx.TRANSPILED_PROD_RENOVATION_PATH));

module.exports = {
    removeDevelopmentStateManagerModules,
    createRemoveDevelopmentStateManagerModulesTask
};
