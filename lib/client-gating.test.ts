import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activationSucceeded, pendingSessionId } from "./activation.ts";
import { isFreeType, typeForEntitlement } from "./qr-types.ts";

describe("paid QR types after Pro is revoked", () => {
  it("drops a selected paid type to URL when Pro is off", () => {
    for (const type of ["wifi", "email", "phone", "sms", "vcard"] as const) {
      assert.equal(isFreeType(type), false, type);
      assert.equal(typeForEntitlement(type, false), "url", type);
      assert.equal(typeForEntitlement(type, true), type, type);
    }
    assert.equal(typeForEntitlement("text", false), "text");
  });
});

describe("checkout activation retry", () => {
  it("only a 2xx { valid: true } counts as activated", () => {
    assert.equal(activationSucceeded({ ok: true }, { valid: true }), true);
    assert.equal(activationSucceeded({ ok: true }, { valid: false }), false);
    assert.equal(activationSucceeded({ ok: false }, { valid: true }), false, "HTTP 500");
    assert.equal(activationSucceeded(null, null), false, "network error");
    assert.equal(activationSucceeded({ ok: true }, null), false, "bad JSON");
  });

  it("uses the return URL session, else the saved one from a failed attempt", () => {
    assert.equal(pendingSessionId("?pro=success&session_id=cs_test_1", null), "cs_test_1");
    assert.equal(pendingSessionId("", "cs_test_saved"), "cs_test_saved");
    assert.equal(pendingSessionId("?pro=success&session_id=cs_test_1", "cs_test_saved"), "cs_test_1");
    assert.equal(pendingSessionId("?pro=cancel", null), null);
    assert.equal(pendingSessionId("?pro=success&session_id=evil", "junk"), null);
  });
});

describe("Pro QR previews for free visitors", () => {
  it("renders no image for paid types without Pro (landing pages like /qr-code-for/wifi)", async () => {
    const { previewAllowed } = await import("./qr-types.ts");
    for (const type of ["wifi", "email", "phone", "sms", "vcard"] as const) {
      assert.equal(previewAllowed(type, false), false, type);
      assert.equal(previewAllowed(type, true), true, type);
    }
    assert.equal(previewAllowed("url", false), true);
    assert.equal(previewAllowed("text", false), true);
  });
});
