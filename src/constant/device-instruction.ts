export const instruction = {
    deviceRegistration: 1,
    deviceUnlock: 2,
    deviceLock: 3,
    noInstruction: 4,
    completedLockRequest: 5,
    completedUnLockRequest: 6,
    LockError: 7,
    unLockError: 8
};

export const instructionName = {
    1: 'deviceRegistration',
    2: 'deviceUnlock',
    3: 'deviceLock',
    4: 'noInstruction',
    5: 'completedLockRequest',
    6: 'completedUnLockRequest',
    7: 'LockError',
    8: 'UnlockError'
};

export const powerInstruction = {
    powerOn: 1,
    powerOff: 2,
    errorPowerOn: 3,
    errorPowerOff: 4,
    requestComplitedPowerOn: 5,
    requestComplitedPowerOff: 6
};

export const powerInstructionName = {
    1: 'powerOn',
    2: 'powerOff',
    3: 'errorPowerOn',
    4: 'errorPowerOff',
    5: 'requestComplitedPowerOn',
    6: 'requestComplitedPowerOff'
};

export const disconectTime = {
    1: 10
};
