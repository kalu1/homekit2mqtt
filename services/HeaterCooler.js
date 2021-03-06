/* eslint unicorn/filename-case: "off", func-names: "off", camelcase: "off", no-unused-vars: "off" */

module.exports = function (iface) {
    const {mqttPub, mqttSub, mqttStatus, log, Service, Characteristic} = iface;

    return function createService_HeaterCooler(acc, settings, subtype) {
        if (typeof settings.payload.activeTrue === 'undefined') {
            settings.payload.activeTrue = true;
        }

        if (typeof settings.payload.activeFalse === 'undefined') {
            settings.payload.activeFalse = false;
        }

        acc.addService(Service.HeaterCooler, settings.name, subtype)
            .getCharacteristic(Characteristic.Active)
            .on('set', (value, callback) => {
                log.debug('< hap set', settings.name, 'Active', value);
                const active = value ? settings.payload.activeTrue : settings.payload.activeFalse;
                mqttPub(settings.topic.setActive, active);
                callback();
            });

        /* istanbul ignore else  */
        if (settings.topic.statusActive) {
            mqttSub(settings.topic.statusActive, val => {
                const active = val === settings.payload.activeTrue ? 1 : 0;
                log.debug('> hap update', settings.name, 'Active', active);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.Active, active);
            });
            acc.getService(subtype)
                .getCharacteristic(Characteristic.Active)
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'Active');
                    const active = mqttStatus[settings.topic.statusActive] === settings.payload.activeTrue ? 1 : 0;
                    log.debug('> hap re_get', settings.name, 'Active', active);
                    callback(null, active);
                });
        }

        acc.getService(subtype)
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps((settings.props || {}).CurrentTemperature)
            .on('get', callback => {
                const temperature = mqttStatus[settings.topic.statusTemperature];
                log.debug('< hap get', settings.name, 'TemperatureSensor', 'CurrentTemperature');
                log.debug('> hap re_get', settings.name, temperature);
                callback(null, temperature);
            });

        mqttSub(settings.topic.statusTemperature, val => {
            log.debug('> hap update', settings.name, 'CurrentTemperature', val);
            acc.getService(subtype)
                .updateCharacteristic(Characteristic.CurrentTemperature, val);
        });

        acc.getService(subtype)
            .getCharacteristic(Characteristic.TemperatureDisplayUnits)
            .on('set', (value, callback) => {
                log.debug('< hap set', settings.name, 'TemperatureDisplayUnits', value);
                log.debug('> config', settings.name, 'TemperatureDisplayUnits', value);
                settings.config.TemperatureDisplayUnits = value;
                callback();
            });

        acc.getService(subtype)
            .getCharacteristic(Characteristic.TemperatureDisplayUnits)
            .on('get', callback => {
                log.debug('< hap get', settings.name, 'TemperatureDisplayUnits');
                log.debug('> hap re_get', settings.name, 'TemperatureDisplayUnits', settings.config.TemperatureDisplayUnits || 0);
                callback(null, settings.config.TemperatureDisplayUnits || 0);
            });

        mqttSub(settings.topic.statusCurrentHeaterCoolerState, val => {
            log.debug('> hap update', settings.name, 'CurrentHeaterCoolerState', val);
            acc.getService(subtype)
                .updateCharacteristic(Characteristic.CurrentHeaterCoolerState, val);
        });
        acc.getService(subtype)
            .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
            .on('get', callback => {
                log.debug('< hap get', settings.name, 'CurrentHeaterCoolerState');
                const state = mqttStatus[settings.topic.statusCurrentHeaterCoolerState];
                log.debug('> hap re_get', settings.name, 'CurrentHeaterCoolerState', state);
                callback(null, state);
            });

        acc.getService(subtype)
            .getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .on('set', (value, callback) => {
                log.debug('< hap set', settings.name, 'TargetHeaterCoolerState', value);
                mqttPub(settings.topic.setTargetHeaterCoolerState, value);
                callback();
            });

        mqttSub(settings.topic.statusTargetHeaterCoolerState, val => {
            log.debug('> hap update', settings.name, 'TargetHeaterCoolerState', val);
            acc.getService(subtype)
                .updateCharacteristic(Characteristic.TargetHeaterCoolerState, val);
        });
        acc.getService(subtype)
            .getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .on('get', callback => {
                log.debug('< hap get', settings.name, 'TargetHeaterCoolerState');
                const state = mqttStatus[settings.topic.statusTargetHeaterCoolerState];
                log.debug('> hap re_get', settings.name, 'TargetHeaterCoolerState', state);
                callback(null, state);
            });

        /* istanbul ignore else */
        if (settings.topic.setSwingMode) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.SwingMode)
                .on('set', (value, callback) => {
                    log.debug('< hap set', settings.name, 'SwingMode', value);
                    mqttPub(settings.topic.setSwingMode, value);
                    callback();
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusSwingMode) {
            mqttSub(settings.topic.statusSwingMode, val => {
                log.debug('> hap update', settings.name, 'SwingMode', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.SwingMode, val);
            });
            acc.getService(subtype)
                .getCharacteristic(Characteristic.SwingMode)
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'SwingMode');
                    const state = mqttStatus[settings.topic.statusSwingMode];
                    log.debug('> hap re_get', settings.name, 'SwingMode', state);
                    callback(null, state);
                });
        }

        /* istanbul ignore else */
        if (settings.topic.setRotationSpeed) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.RotationSpeed)
                .on('set', (value, callback) => {
                    log.debug('< hap set', settings.name, 'RotationSpeed', value * (settings.payload.rotationSpeedFactor || 1));
                    mqttPub(settings.topic.setRotationSpeed, value);
                    callback();
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusRotationSpeed) {
            mqttSub(settings.topic.statusRotationSpeed, val => {
                val = Math.round(val / (settings.payload.rotationSpeedFactor || 1));
                log.debug('> hap update', settings.name, 'RotationSpeed', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.RotationSpeed, val);
            });
            acc.getService(subtype)
                .getCharacteristic(Characteristic.RotationSpeed)
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'RotationSpeed');
                    const speed = Math.round(mqttStatus[settings.topic.statusRotationSpeed] / (settings.payload.rotationSpeedFactor || 1));
                    log.debug('> hap re_get', settings.name, 'RotationSpeed', speed);
                    callback(null, speed);
                });
        }

        /* istanbul ignore else */
        if (settings.topic.setCoolingThresholdTemperature) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.CoolingThresholdTemperature)
                .on('set', (value, callback) => {
                    log.debug('< hap set', settings.name, 'CoolingThresholdTemperature', value);
                    mqttPub(settings.topic.setCoolingThresholdTemperature, value, settings.mqttPublishOptions);
                    callback();
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusCoolingThresholdTemperature) {
            mqttSub(settings.topic.statusCoolingThresholdTemperature, val => {
                log.debug('> hap update', settings.name, 'CoolingThresholdTemperature', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.CoolingThresholdTemperature, val);
            });

            acc.getService(subtype)
                .getCharacteristic(Characteristic.CoolingThresholdTemperature)
                .setProps((settings.props || {}).CoolingThresholdTemperature || {minValue: 4})
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'CoolingThresholdTemperature');
                    log.debug('> hap re_get', settings.name, 'CoolingThresholdTemperature', mqttStatus[settings.topic.statusCoolingThresholdTemperature]);
                    callback(null, mqttStatus[settings.topic.statusCoolingThresholdTemperature]);
                });
        }

        /* istanbul ignore else */
        if (settings.topic.setHeatingThresholdTemperature) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.HeatingThresholdTemperature)
                .on('set', (value, callback) => {
                    log.debug('< hap set', settings.name, 'HeatingThresholdTemperature', value);
                    mqttPub(settings.topic.setHeatingThresholdTemperature, value, settings.mqttPublishOptions);
                    callback();
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusHeatingThresholdTemperature) {
            mqttSub(settings.topic.statusHeatingThresholdTemperature, val => {
                log.debug('> hap update', settings.name, 'HeatingThresholdTemperature', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.HeatingThresholdTemperature, val);
            });

            acc.getService(subtype)
                .getCharacteristic(Characteristic.HeatingThresholdTemperature)
                .setProps((settings.props || {}).HeatingThresholdTemperature)
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'HeatingThresholdTemperature');
                    log.debug('> hap re_get', settings.name, 'HeatingThresholdTemperature', mqttStatus[settings.topic.statusHeatingThresholdTemperature]);
                    callback(null, mqttStatus[settings.topic.statusHeatingThresholdTemperature]);
                });
        }
    };
};
