registerPlugin({
  name: "Feature Test",
  description: "Sinusbot Scripting Engine Feature Tests",
  version: "1.0",
  author: "SinusBot Team"
}, (sinusbot, config) => {

  // set your values here:
  const INSTANCE_ID = ""
  const BOT_ID = ""
  const BACKEND = "ts3"
  const IS_RUNNING = true

  const tests = [];

  const engine = require("engine")
  const backend = require("backend")
  const store = require("store")
  const media = require("media")
  const audio = require("audio")
  const format = require("format")
  const helpers = require("helpers")
  const event = require("event")

  function finalize() {
    const [totalSuccess, totalFailed] = tests.reduce((acc, curr) => [acc[0] + curr.getStatus()[0], acc[1] + curr.getStatus()[1]], [0, 0]);
    engine.log(`${totalSuccess}/${totalSuccess+totalFailed} tests passing`)
    if (totalFailed > 0) engine.log(`${totalFailed} Tests failed`)
  }

  function describe(...args) {
    const test = new Test(...args);
    tests.push(test)
    return test
  }

  class Test {
    constructor(method) {
      engine.log(`${method}`)
      this._method = method
      this._fails = 0
      this._success = 0
    }

    it(description, callback) {
      try {
        callback()
        this._success++
        engine.log(`\t✓ ${description}`)
      } catch(e) {
        this._fails++
        engine.log(`\tX ${description}`)
        engine.log(e)
      }
      return this
    }

    getStatus() {
      return [this._success, this._fails]
    }
  }

  const assert = {
    equals: (actual, expected) => {
      if (actual !== expected) {
        if (typeof actual === "string") actual = `"${actual.replace(/"/g, '\\"')}"`
        if (typeof expected === "string") expected = `"${expected.replace(/"/g, '\\"')}"`
        throw new Error(`Assertion failed: Expected ${expected}, but got ${actual}`)
      }
      return true
    }
  }


  /**
   * engine module
   */

  describe("engine#getInstanceID")
    .it("should return a string", () => assert.equals(typeof engine.getInstanceID(), "string"))
    .it("should return the correct instance id", () => assert.equals(engine.getInstanceID(), INSTANCE_ID))

  describe("engine#getBotID")
    .it("should return a string", () => assert.equals(typeof engine.getBotID(), "string"))
    .it("should return the correct bot id", () => assert.equals(engine.getBotID(), BOT_ID))

  describe("engine#getBackend")
    .it("should return a string", () => assert.equals(typeof engine.getBackend(), "string"))
    .it("should return the correct backend", () => assert.equals(engine.getBackend(), BACKEND))

  describe("engine#setInstanceLogLevel & engine#getInstanceLogLevel")
    .it("should set the Instance Log Level to 8 and retrieve the correct value", () => {
      engine.setInstanceLogLevel(8)
      assert.equals(engine.getInstanceLogLevel(), 8)
    })
    .it("should set the Instance Log Level to 5 and retrieve the correct value", () => {
      engine.setInstanceLogLevel(5)
      assert.equals(engine.getInstanceLogLevel(), 5)
    })

  describe("engine#setBotLogLevel & engine#getBotLogLevel")
    .it("should set the Bot Log Level to 8 and retrieve the correct value", () => {
      engine.setBotLogLevel(8)
      assert.equals(engine.getBotLogLevel(), 8)
    })
    .it("should set the Bot Log Level to 5 and retrieve the correct value", () => {
      engine.setBotLogLevel(5)
      assert.equals(engine.getBotLogLevel(), 5)
    })

  describe("engine#setNick & engine#getNick")
    .it("should set the Nick to \"john\" and retrieve the correct value", () => {
      engine.setNick("john")
      assert.equals(engine.getNick(), "john")
    })
    .it("should set the Nick to \"jane\" and retrieve the correct value", () => {
      engine.setNick("jane")
      assert.equals(engine.getNick(), "jane")
    })

  describe("engine#setDefaultChannelID")
    .it("should set the default channel id", () => {
      assert.equals(engine.setDefaultChannelID("500"), true)
    })

  describe("engine#isRunning")
    .it("should check if the backend of this instance has been started", () => {
      assert.equals(engine.isRunning(), IS_RUNNING)
    })

  describe("engine#notify")
    .it("should check if a notification gets sent to the webinterface (check the webinterface no error gets thrown here)", () => {
      setTimeout(() => engine.notify("TEST NOTIFICATION FOR THE WEBINTERFACE"), 5000)
    })

  /*
  describe("engine#saveConfig")
    .it("should check if the configuration gets saved", () => {
      throw new Error("TODO")
    })
  */

  /*
  describe("engine#export")
    .it("should export and reimport a module", () => {
      throw new Error("TODO")
    })
  */

  /*
  describe("engine#removeAvatar")
    .it("should remove the Avatar successfully", () => {
      throw new Error("TODO")
    })
  */

  /*
  describe("engine#setAvatarFromTrack")
    .it("should set the Avatar from track successfully", () => {
      throw new Error("TODO")
    })
  */

  /*
  describe("engine#setDefaultAvatar")
    .it("should set the default Avatar successfully", () => {
      throw new Error("TODO")
    })
  */

  /*
  describe("engine#setAvatarFromBanner")
    .it("should set the Avatar from Banner successfully", () => {
      throw new Error("TODO")
    })
  */

  describe("engine#getUsers")
    .it("should check if the function returns an array", () => {
      assert.equals(typeof engine.getUsers(), "object")
      assert.equals(Array.isArray(engine.getUsers()), true)
    })
    .it("should check if the function returns the correct User object", () => {
      engine.getUsers().forEach(user => {
        assert.equals(typeof user.isAdmin(), "boolean")
      })
    })

  /*
  describe("engine#getUserById")
    .it("should retrieve the correct user by its id", () => {
      throw new Error("TODO")
    })
  */

  /*
  describe("engine#getUserByName")
    .it("should retrieve the correct user by its name", () => {
      throw new Error("TODO")
    })
  */

  describe("engine#setCommandPrefix & engine#getCommandPrefix")
    .it("should set the Bots Command Prefix to \".\" and retrieve the correct value", () => {
      engine.setCommandPrefix(".")
      assert.equals(engine.getCommandPrefix(), ".")
    })
    .it("should set the Bots Command Prefix to \"!\" and retrieve the correct value", () => {
      engine.setCommandPrefix("!")
      assert.equals(engine.getCommandPrefix(), "!")
    })


  /**
   * store module
   */

  //do some cleanup first
  try {
    store.getKeys().forEach(key => store.unset(key))
    store.getKeysGlobal().forEach(key => store.unsetGlobal(key))
    store.getKeysInstance().forEach(key => store.unsetInstance(key))
  } catch (e) {
    engine.log("Failed while working on store cleanup actions!")
    engine.log(e)
  }

  describe("store script namespace")
    .it("should set 3 values and return a boolean everytime", () => {
      assert.equals(typeof store.set("testkey0", "testvalue0"), "boolean")
      assert.equals(typeof store.set("testkey1", "testvalue1"), "boolean")
      assert.equals(typeof store.set("testkey2", "testvalue2"), "boolean")
    })
    .it("should retrieve the 3 correct values", () => {
      assert.equals(store.get("testkey0"), "testvalue0")
      assert.equals(store.get("testkey1"), "testvalue1")
      assert.equals(store.get("testkey2"), "testvalue2")
    })
    .it("should retrieve the 3 stored keys", () => {
      assert.equals(JSON.stringify(store.getKeys()), JSON.stringify(["testkey0", "testkey1", "testkey2"]))
    })
    .it("should retrieve all 3 stored key, value pairs", () => {
      assert.equals(
        JSON.stringify(store.getAll()),
        JSON.stringify({
          "testkey0": "testvalue0",
          "testkey1": "testvalue1",
          "testkey2": "testvalue2"
        })
      )
    })
    .it("should unset a single key", () => {
      assert.equals(typeof store.unset("testkey1"), "boolean")
    })
    .it("should check if the right key has been deleted", () => {
      assert.equals(store.get("testkey0"), "testvalue0")
      assert.equals(store.get("testkey1"), undefined)
      assert.equals(store.get("testkey2"), "testvalue2")
    })

  describe("store global namespace")
    .it("should set 3 values and return everytime a boolean", () => {
      assert.equals(typeof store.setGlobal("testkey0", "testvalue0"), "boolean")
      assert.equals(typeof store.setGlobal("testkey1", "testvalue1"), "boolean")
      assert.equals(typeof store.setGlobal("testkey2", "testvalue2"), "boolean")
    })
    .it("should retrieve the 3 correct values", () => {
      assert.equals(store.getGlobal("testkey0"), "testvalue0")
      assert.equals(store.getGlobal("testkey1"), "testvalue1")
      assert.equals(store.getGlobal("testkey2"), "testvalue2")
    })
    .it("should retrieve the 3 stored keys", () => {
      assert.equals(JSON.stringify(store.getKeysGlobal()), JSON.stringify(["testkey0", "testkey1", "testkey2"]))
    })
    .it("should retrieve all 3 stored key, value pairs", () => {
      assert.equals(
        JSON.stringify(store.getAllGlobal()),
        JSON.stringify({
          "testkey0": "testvalue0",
          "testkey1": "testvalue1",
          "testkey2": "testvalue2"
        })
      )
    })
    .it("should unset a single key", () => {
      assert.equals(typeof store.unsetGlobal("testkey1"), "boolean")
    })
    .it("should check if the right key has been deleted", () => {
      assert.equals(store.getGlobal("testkey0"), "testvalue0")
      assert.equals(store.getGlobal("testkey1"), undefined)
      assert.equals(store.getGlobal("testkey2"), "testvalue2")
    })

  describe("store instance namespace")
    .it("should set 3 values and return everytime a boolean", () => {
      assert.equals(typeof store.setInstance("testkey0", "testvalue0"), "boolean")
      assert.equals(typeof store.setInstance("testkey1", "testvalue1"), "boolean")
      assert.equals(typeof store.setInstance("testkey2", "testvalue2"), "boolean")
    })
    .it("should retrieve the 3 correct values", () => {
      assert.equals(store.getInstance("testkey0"), "testvalue0")
      assert.equals(store.getInstance("testkey1"), "testvalue1")
      assert.equals(store.getInstance("testkey2"), "testvalue2")
    })
    .it("should retrieve the 3 stored keys", () => {
      assert.equals(JSON.stringify(store.getKeysInstance()), JSON.stringify(["testkey0", "testkey1", "testkey2"]))
    })
    .it("should retrieve all 3 stored key, value pairs", () => {
      assert.equals(
        JSON.stringify(store.getAllInstance()),
        JSON.stringify({
          "testkey0": "testvalue0",
          "testkey1": "testvalue1",
          "testkey2": "testvalue2"
        })
      )
    })
    .it("should unset a single key", () => {
      assert.equals(typeof store.unsetInstance("testkey1"), "boolean")
    })
    .it("should check if the right key has been deleted", () => {
      assert.equals(store.getInstance("testkey0"), "testvalue0")
      assert.equals(store.getInstance("testkey1"), undefined)
      assert.equals(store.getInstance("testkey2"), "testvalue2")
    })


  /**
   * helpers module
   */

  describe("helpers#getRandom")
    .it("should check if a correct random gets retrieved (max 10) (1000 iterations)", () => {
      Array(1000).fill().forEach(() => assert.equals(helpers.getRandom(10) <= 10, true))
    })

  describe("helpers#toString")
    .it("should check if a object gets converted correctly", () => {
      assert.equals(helpers.toString({"test": 1}), "")
    })

  describe("helpers#base64Encode")
    .it("should check if a string gets encoded correctly", () => {
      assert.equals(helpers.base64Encode("testing base 64 encoding"), "dGVzdGluZyBiYXNlIDY0IGVuY29kaW5n")
    })

  describe("helpers#base64Decode")
    .it("should check if a string gets decoded correctly", () => {
      assert.equals(helpers.base64Decode("dGVzdGluZyBiYXNlIDY0IGVuY29kaW5n"), "testing base 64 encoding")
    })

  describe("helpers#hexEncode")
    .it("should check if a string gets encoded correctly", () => {
      assert.equals(helpers.hexEncode("testing hex encoding"), "74657374696e672068657820656e636f64696e67")
    })

  describe("helpers#hexDecode")
    .it("should check if a string gets decoded correctly", () => {
      assert.equals(helpers.hexDecode("74657374696e672068657820656e636f64696e67"), "testing hex encoding")
    })

  describe("helpers#MD5Sum")
    .it("should check if a string gets hashed correctly", () => {
      assert.equals(helpers.MD5Sum("testing md5 sum"), "8e883509e2484966bd9759b5e81c594d")
    })

  describe("helpers#SHA1Sum")
    .it("should check if a string gets hashed correctly", () => {
      assert.equals(helpers.SHA1Sum("testing sha1 sum"), "ea5abb634e1c6a1f65189424f758f4ed04d877cc")
    })

  describe("helpers#SHA256Sum")
    .it("should check if a string gets hashed correctly", () => {
      assert.equals(helpers.SHA256Sum("testing sha256 sum"), "a96a4dc886d0efdb77662da0db983e2b269289ac695216cbec95181d43e28762")
    })


  /**
   * http module
   */

  describe("http#simpleRequest")
    .it("should check if a string gets hashed correctly", () => {
      http.simpleRequest({
          'method': 'GET',
          'url': 'https://postman-echo.com/status/200',
          'timeout': 10 * 1000,
      }, (error, {statusCode, data}) => {
        //TODO: do this properly (dunno how to handle async stuff in this case :/)
        assert.equals(error, null)
        assert.equals(statusCode, 200)
        assert.equals(data.toString(), '{"status":200}')
      })
    })

  finalize()
})
