const DeviceParser = require('./DeviceParser');
const AccessoryParser = require('./AccessoryParser');
const SwitchVirtualBasePressParser = require('./SwitchVirtualBasePressParser');

class Button2Parser extends DeviceParser {
    constructor(platform) {
        super(platform);
    }
    
    getAccessoriesParserInfo() {
        var parserInfo = {
            'Button2_StatelessProgrammableSwitch': Button2StatelessProgrammableSwitchParser,
        }
        this.platform.log.debug(this.platform);
        if (!this.platform.ConfigUtil.getDisableVirtualButtons()) {
            parserInfo['Button2_Switch_VirtualSinglePress'] = Button2SwitchVirtualSinglePressParser;
            parserInfo['Button2_Switch_VirtualDoublePress'] = Button2SwitchVirtualDoublePressParser;
            //parserInfo['Button2_Switch_VirtualLongPress'] = Button2SwitchVirtualLongPressParser;
        }
        return parserInfo
    }
}
module.exports = Button2Parser;

class Button2StatelessProgrammableSwitchParser extends AccessoryParser {
    constructor(platform, accessoryType) {
        super(platform, accessoryType)
    }
    
    getAccessoryCategory(deviceSid) {
        return this.Accessory.Categories.PROGRAMMABLE_SWITCH;
    }
    
    getAccessoryInformation(deviceSid) {
        return {
            'Manufacturer': 'Aqara',
            'Model': 'Button 2',
            'SerialNumber': deviceSid
        };
    }

    getServices(jsonObj, accessoryName) {
        var that = this;
        var result = [];
        
        var service = new that.Service.StatelessProgrammableSwitch(accessoryName);
        var switchEventCharacteristic = service.getCharacteristic(that.Characteristic.ProgrammableSwitchEvent);
        switchEventCharacteristic.setProps({
            maxValue: 1,
        });
        result.push(service);
        
        var batteryService  = new that.Service.BatteryService(accessoryName);
        batteryService.getCharacteristic(that.Characteristic.StatusLowBattery);
        batteryService.getCharacteristic(that.Characteristic.BatteryLevel);
        batteryService.getCharacteristic(that.Characteristic.ChargingState);
        result.push(batteryService);
        
        return result;
    }
    
    parserAccessories(jsonObj) {
        var that = this;
        var deviceSid = jsonObj['sid'];
        var uuid = that.getAccessoryUUID(deviceSid);
        var accessory = that.platform.AccessoryUtil.getByUUID(uuid);
        if(accessory) {
            var service = accessory.getService(that.Service.StatelessProgrammableSwitch);
            var programmableSwitchEventCharacteristic = service.getCharacteristic(that.Characteristic.ProgrammableSwitchEvent);
            var value = that.getProgrammableSwitchEventCharacteristicValue(jsonObj, null);
            if(null != value) {
                programmableSwitchEventCharacteristic.updateValue(value);
            }
            
            that.parserBatteryService(accessory, jsonObj);
        }
    }
    
    getProgrammableSwitchEventCharacteristicValue(jsonObj, defaultValue) {
        var value = this.getValueFrJsonObjData(jsonObj, 'status');
        if(value === 'click') {
            return this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS;
        } else if(value === 'double_click') {
            return this.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS;
        } else if(value === 'long_click_release') {
            /* 'long_click_press' */
            return this.Characteristic.ProgrammableSwitchEvent.LONG_PRESS;
        } else {
            return defaultValue;
        }
    }
}

class Button2SwitchVirtualBasePressParser extends SwitchVirtualBasePressParser {
    getAccessoryInformation(deviceSid) {
        return {
            'Manufacturer': 'Aqara',
            'Model': 'Button',
            'SerialNumber': deviceSid
        };
    }
}

class Button2SwitchVirtualSinglePressParser extends Button2SwitchVirtualBasePressParser {
    getWriteCommand(deviceSid, value) {
        return '{"cmd":"write","model":"sensor_switch.aq2","sid":"' + deviceSid + '","data":"{\\"status\\":\\"click\\", \\"key\\": \\"${key}\\"}"}';
    }
    
    doSomething(jsonObj) {
        var deviceSid = jsonObj['sid'];
        var newObj = JSON.parse("{\"cmd\":\"report\",\"model\":\"sensor_switch.aq2\",\"sid\":\"" + deviceSid + "\",\"data\":\"{\\\"status\\\":\\\"click\\\"}\"}");
        this.platform.ParseUtil.parserAccessories(newObj);
    }
}

class Button2SwitchVirtualDoublePressParser extends Button2SwitchVirtualBasePressParser {
    getWriteCommand(deviceSid, value) {
        return '{"cmd":"write","model":"sensor_switch.aq2","sid":"' + deviceSid + '","data":"{\\"status\\":\\"double_click\\", \\"key\\": \\"${key}\\"}"}';
    }
    
    doSomething(jsonObj) {
        var deviceSid = jsonObj['sid'];
        var newObj = JSON.parse("{\"cmd\":\"report\",\"model\":\"sensor_switch.aq2\",\"sid\":\"" + deviceSid + "\",\"data\":\"{\\\"status\\\":\\\"double_click\\\"}\"}");
        this.platform.ParseUtil.parserAccessories(newObj);
    }
}

// class Button2SwitchVirtualLongPressParser extends Button2SwitchVirtualBasePressParser {
    // getWriteCommand(deviceSid, value) {
        // return '{"cmd":"write","model":"sensor_switch.aq2","sid":"' + deviceSid + '","data":"{\\"status\\":\\"long_click_press\\", \\"key\\": \\"${key}\\"}"}';
    // }
// }
