/* eslint unicorn/filename-case: "off", func-names: "off", camelcase: "off", no-unused-vars: "off" */

module.exports = function (iface) {
    const {mqttPub, mqttSub, mqttStatus, log, Service, Characteristic} = iface;

    return function createService_HumidifierDehumidifier(acc, settings, subtype) {
        if (typeof settings.payload.activeTrue === 'undefined') {
            settings.payload.activeTrue = true;
        }

        if (typeof settings.payload.activeFalse === 'undefined') {
            settings.payload.activeFalse = false;
        }

        acc.addService(Service.HumidifierDehumidifier, settings.name, subtype)
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
            .getCharacteristic(Characteristic.WaterLevel)
            .setProps((settings.props || {}).WaterLevel)
            .on('get', callback => {
                const humidity = mqttStatus[settings.topic.statusWaterLevel];
                log.debug('< hap get', settings.name, 'TemperatureSensor', 'WaterLevel');
                log.debug('> hap re_get', settings.name, humidity);
                callback(null, humidity);
            });

        mqttSub(settings.topic.statusWaterLevel, val => {
            log.debug('> hap update', settings.name, 'WaterLevel', val);
            acc.getService(subtype)
                .updateCharacteristic(Characteristic.WaterLevel, val);
        });

        mqttSub(settings.topic.statusCurrentHumidifierDehumidifierState, val => {
            log.debug('> hap update', settings.name, 'CurrentHumidifierDehumidifierState', val);
            acc.getService(subtype)
                .updateCharacteristic(Characteristic.CurrentHumidifierDehumidifierState, val);
        });
        acc.getService(subtype)
            .getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
            .on('get', callback => {
                log.debug('< hap get', settings.name, 'CurrentHumidifierDehumidifierState');
                const state = mqttStatus[settings.topic.statusCurrentHumidifierDehumidifierState];
                log.debug('> hap re_get', settings.name, 'CurrentHumidifierDehumidifierState', state);
                callback(null, state);
            });

        acc.getService(subtype)
            .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
            .on('set', (value, callback) => {
                log.debug('< hap set', settings.name, 'TargetHumidifierDehumidifierState', value);
                mqttPub(settings.topic.setTargetHumidifierDehumidifierState, value);
                callback();
            });

        mqttSub(settings.topic.statusTargetHumidifierDehumidifierState, val => {
            log.debug('> hap update', settings.name, 'TargetHumidifierDehumidifierState', val);
            acc.getService(subtype)
                .updateCharacteristic(Characteristic.TargetHumidifierDehumidifierState, val);
        });
        acc.getService(subtype)
            .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
            .on('get', callback => {
                log.debug('< hap get', settings.name, 'TargetHumidifierDehumidifierState');
                const state = mqttStatus[settings.topic.statusTargetHumidifierDehumidifierState];
                log.debug('> hap re_get', settings.name, 'TargetHumidifierDehumidifierState', state);
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
        if (settings.topic.setRelativeHumidityDehumidifierThreshold) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold)
                .on('set', (value, callback) => {
                    log.debug('< hap set', settings.name, 'RelativeHumidityDehumidifierThreshold', value);
                    mqttPub(settings.topic.setRelativeHumidityDehumidifierThreshold, value, settings.mqttPublishOptions);
                    callback();
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusRelativeHumidityDehumidifierThreshold) {
            mqttSub(settings.topic.statusRelativeHumidityDehumidifierThreshold, val => {
                log.debug('> hap update', settings.name, 'RelativeHumidityDehumidifierThreshold', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold, val);
            });

            acc.getService(subtype)
                .getCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold)
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'RelativeHumidityDehumidifierThreshold');
                    log.debug('> hap re_get', settings.name, 'RelativeHumidityDehumidifierThreshold', mqttStatus[settings.topic.statusRelativeHumidityDehumidifierThreshold]);
                    callback(null, mqttStatus[settings.topic.statusRelativeHumidityDehumidifierThreshold]);
                });
        }

        /* istanbul ignore else */
        if (settings.topic.setRelativeHumidityHumidifierThreshold) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
                .on('set', (value, callback) => {
                    log.debug('< hap set', settings.name, 'RelativeHumidityHumidifierThreshold', value);
                    mqttPub(settings.topic.setRelativeHumidityHumidifierThreshold, value, settings.mqttPublishOptions);
                    callback();
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusRelativeHumidityHumidifierThreshold) {
            mqttSub(settings.topic.statusRelativeHumidityHumidifierThreshold, val => {
                log.debug('> hap update', settings.name, 'RelativeHumidityHumidifierThreshold', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold, val);
            });

            acc.getService(subtype)
                .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
                .on('get', callback => {
                    log.debug('< hap get', settings.name, 'RelativeHumidityHumidifierThreshold');
                    log.debug('> hap re_get', settings.name, 'RelativeHumidityHumidifierThreshold', mqttStatus[settings.topic.statusRelativeHumidityHumidifierThreshold]);
                    callback(null, mqttStatus[settings.topic.statusRelativeHumidityHumidifierThreshold]);
                });
        }

        /* istanbul ignore else */
        if (settings.topic.statusWaterLevel) {
            acc.getService(subtype)
                .getCharacteristic(Characteristic.WaterLevel)
                .on('get', callback => {
                    const humidity = mqttStatus[settings.topic.statusWaterLevel] / (settings.payload.waterLevelFactor || 1);
                    log.debug('< hap get', settings.name, 'TemperatureSensor', 'WaterLevel');
                    log.debug('> hap re_get', settings.name, humidity);
                    callback(null, humidity);
                });

            mqttSub(settings.topic.statusWaterLevel, val => {
                val /= (settings.payload.waterLevelFactor || 1);
                log.debug('> hap update', settings.name, 'WaterLevel', val);
                acc.getService(subtype)
                    .updateCharacteristic(Characteristic.WaterLevel, val);
            });
        }
    };
};
