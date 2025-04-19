"use strict";
/**
 * UOR Encoder - Core Implementation
 *
 * Minimal implementation focusing on resource/resourceType model.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryKnowledgeBase = exports.UOREncoder = void 0;
exports.testEncoderDecoderSync = testEncoderDecoderSync;
/**
 * In-memory implementation of Knowledge Base
 */
var InMemoryKnowledgeBase = /** @class */ (function () {
    function InMemoryKnowledgeBase() {
        this.storage = {};
    }
    InMemoryKnowledgeBase.prototype.get = function (resourceType, resourceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.storage[resourceType])
                    return [2 /*return*/, null];
                return [2 /*return*/, this.storage[resourceType][resourceId] || null];
            });
        });
    };
    InMemoryKnowledgeBase.prototype.set = function (resourceType, resourceId, record) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.storage[resourceType]) {
                    this.storage[resourceType] = {};
                }
                this.storage[resourceType][resourceId] = record;
                return [2 /*return*/];
            });
        });
    };
    return InMemoryKnowledgeBase;
}());
exports.InMemoryKnowledgeBase = InMemoryKnowledgeBase;
/**
 * UOR Encoder - Core implementation
 */
var UOREncoder = /** @class */ (function () {
    function UOREncoder(knowledgeBase) {
        this.knowledgeBase = knowledgeBase;
    }
    /**
     * Encode a resource with its type
     * @param resource - The resource to encode
     * @param resourceType - The type of the resource
     * @returns The ID of the encoded resource
     */
    UOREncoder.prototype.encode = function (resource, resourceType) {
        return __awaiter(this, void 0, void 0, function () {
            var resourceId, record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resourceId = resource.id || resource['@id'] || "".concat(resourceType, "_").concat(Date.now());
                        record = {
                            resource: resource,
                            resourceType: resourceType
                        };
                        // Process any references to other resources
                        return [4 /*yield*/, this.processReferences(record)];
                    case 1:
                        // Process any references to other resources
                        _a.sent();
                        // Store the record
                        return [4 /*yield*/, this.knowledgeBase.set(resourceType, resourceId, record)];
                    case 2:
                        // Store the record
                        _a.sent();
                        return [2 /*return*/, resourceId];
                }
            });
        });
    };
    /**
     * Recursively process references in a resource
     * @param record - The UOR record to process
     */
    UOREncoder.prototype.processReferences = function (record) {
        return __awaiter(this, void 0, void 0, function () {
            var resource, i, pointer, _a, _b, _c, _i, key, pointer;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        resource = record.resource;
                        // Skip if not an object
                        if (!resource || typeof resource !== 'object')
                            return [2 /*return*/];
                        if (!Array.isArray(resource)) return [3 /*break*/, 7];
                        i = 0;
                        _d.label = 1;
                    case 1:
                        if (!(i < resource.length)) return [3 /*break*/, 6];
                        if (!(resource[i] && typeof resource[i] === 'object')) return [3 /*break*/, 5];
                        if (!this.isResourceReference(resource[i])) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createPointer(resource[i])];
                    case 2:
                        pointer = _d.sent();
                        resource[i] = pointer;
                        return [3 /*break*/, 5];
                    case 3: 
                    // Recursively process
                    return [4 /*yield*/, this.processReferences({
                            resource: resource[i],
                            resourceType: record.resourceType
                        })];
                    case 4:
                        // Recursively process
                        _d.sent();
                        _d.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                    case 7:
                        _a = resource;
                        _b = [];
                        for (_c in _a)
                            _b.push(_c);
                        _i = 0;
                        _d.label = 8;
                    case 8:
                        if (!(_i < _b.length)) return [3 /*break*/, 13];
                        _c = _b[_i];
                        if (!(_c in _a)) return [3 /*break*/, 12];
                        key = _c;
                        if (!(resource[key] && typeof resource[key] === 'object')) return [3 /*break*/, 12];
                        if (!this.isResourceReference(resource[key])) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.createPointer(resource[key])];
                    case 9:
                        pointer = _d.sent();
                        resource[key] = pointer;
                        return [3 /*break*/, 12];
                    case 10: 
                    // Recursively process
                    return [4 /*yield*/, this.processReferences({
                            resource: resource[key],
                            resourceType: record.resourceType
                        })];
                    case 11:
                        // Recursively process
                        _d.sent();
                        _d.label = 12;
                    case 12:
                        _i++;
                        return [3 /*break*/, 8];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if an object is a reference to another resource
     * @param obj - The object to check
     * @returns True if this is a resource reference
     */
    UOREncoder.prototype.isResourceReference = function (obj) {
        // A resource reference must have a type indicator
        // For schema.org, this is @type
        // This could be expanded for other type systems
        return obj && typeof obj === 'object' && (obj['@type'] !== undefined ||
            obj['type'] !== undefined ||
            obj['resourceType'] !== undefined);
    };
    /**
     * Create a UOR pointer for a resource reference
     * @param reference - The resource reference
     * @returns A UOR pointer
     */
    UOREncoder.prototype.createPointer = function (reference) {
        return __awaiter(this, void 0, void 0, function () {
            var resourceType, resourceId, existingRecord, record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resourceType = reference['@type'] || reference['type'] || reference['resourceType'];
                        resourceId = reference.id || reference['@id'] || "".concat(resourceType, "_").concat(Date.now());
                        return [4 /*yield*/, this.knowledgeBase.get(resourceType, resourceId)];
                    case 1:
                        existingRecord = _a.sent();
                        if (!!existingRecord) return [3 /*break*/, 4];
                        record = {
                            resource: reference,
                            resourceType: resourceType
                        };
                        // Process any nested references
                        return [4 /*yield*/, this.processReferences(record)];
                    case 2:
                        // Process any nested references
                        _a.sent();
                        // Store the record
                        return [4 /*yield*/, this.knowledgeBase.set(resourceType, resourceId, record)];
                    case 3:
                        // Store the record
                        _a.sent();
                        _a.label = 4;
                    case 4: 
                    // Return a pointer
                    return [2 /*return*/, {
                            resourceType: resourceType,
                            resourceId: resourceId
                        }];
                }
            });
        });
    };
    /**
     * Decode a resource from the knowledge base
     * @param resourceType - The type of the resource
     * @param resourceId - The ID of the resource
     * @returns The decoded resource
     */
    UOREncoder.prototype.decode = function (resourceType, resourceId) {
        return __awaiter(this, void 0, void 0, function () {
            var record, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.knowledgeBase.get(resourceType, resourceId)];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, null];
                        result = JSON.parse(JSON.stringify(record.resource));
                        // Resolve any pointers
                        return [4 /*yield*/, this.resolvePointers(result)];
                    case 2:
                        // Resolve any pointers
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Recursively resolve pointers in a resource
     * @param resource - The resource to process
     */
    UOREncoder.prototype.resolvePointers = function (resource) {
        return __awaiter(this, void 0, void 0, function () {
            var i, _a, _b, _c, _d, _e, _i, key, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        // Skip if not an object
                        if (!resource || typeof resource !== 'object')
                            return [2 /*return*/];
                        if (!Array.isArray(resource)) return [3 /*break*/, 7];
                        i = 0;
                        _h.label = 1;
                    case 1:
                        if (!(i < resource.length)) return [3 /*break*/, 6];
                        if (!this.isPointer(resource[i])) return [3 /*break*/, 3];
                        // Resolve pointer
                        _a = resource;
                        _b = i;
                        return [4 /*yield*/, this.resolvePointer(resource[i])];
                    case 2:
                        // Resolve pointer
                        _a[_b] = _h.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(resource[i] && typeof resource[i] === 'object')) return [3 /*break*/, 5];
                        // Recursively process
                        return [4 /*yield*/, this.resolvePointers(resource[i])];
                    case 4:
                        // Recursively process
                        _h.sent();
                        _h.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                    case 7:
                        _c = resource;
                        _d = [];
                        for (_e in _c)
                            _d.push(_e);
                        _i = 0;
                        _h.label = 8;
                    case 8:
                        if (!(_i < _d.length)) return [3 /*break*/, 13];
                        _e = _d[_i];
                        if (!(_e in _c)) return [3 /*break*/, 12];
                        key = _e;
                        if (!this.isPointer(resource[key])) return [3 /*break*/, 10];
                        // Resolve pointer
                        _f = resource;
                        _g = key;
                        return [4 /*yield*/, this.resolvePointer(resource[key])];
                    case 9:
                        // Resolve pointer
                        _f[_g] = _h.sent();
                        return [3 /*break*/, 12];
                    case 10:
                        if (!(resource[key] && typeof resource[key] === 'object')) return [3 /*break*/, 12];
                        // Recursively process
                        return [4 /*yield*/, this.resolvePointers(resource[key])];
                    case 11:
                        // Recursively process
                        _h.sent();
                        _h.label = 12;
                    case 12:
                        _i++;
                        return [3 /*break*/, 8];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if an object is a UOR pointer
     * @param obj - The object to check
     * @returns True if this is a UOR pointer
     */
    UOREncoder.prototype.isPointer = function (obj) {
        return obj &&
            typeof obj === 'object' &&
            'resourceType' in obj &&
            'resourceId' in obj;
    };
    /**
     * Resolve a UOR pointer to its resource
     * @param pointer - The UOR pointer
     * @returns The resolved resource
     */
    UOREncoder.prototype.resolvePointer = function (pointer) {
        return __awaiter(this, void 0, void 0, function () {
            var record, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.knowledgeBase.get(pointer.resourceType, pointer.resourceId)];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, null];
                        result = JSON.parse(JSON.stringify(record.resource));
                        // Resolve any nested pointers
                        return [4 /*yield*/, this.resolvePointers(result)];
                    case 2:
                        // Resolve any nested pointers
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return UOREncoder;
}());
exports.UOREncoder = UOREncoder;
/**
 * Test function for verifying encoder/decoder synchronization
 */
function testEncoderDecoderSync() {
    return __awaiter(this, void 0, void 0, function () {
        var kb, encoder, intrinsicPrimes, id1, decoded1, test1Pass, relatedConcept, relatedId, uniqueFactorization, id2, decoded2, test2Pass;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Testing UOR encoder/decoder synchronization...");
                    kb = new InMemoryKnowledgeBase();
                    encoder = new UOREncoder(kb);
                    intrinsicPrimes = {
                        "@context": "https://schema.org",
                        "@type": "MathematicalObject",
                        "@id": "intrinsicPrimes",
                        "name": "Intrinsic Primes",
                        "description": "Fundamental building blocks in UOR"
                    };
                    return [4 /*yield*/, encoder.encode(intrinsicPrimes, "schema.org/MathematicalObject")];
                case 1:
                    id1 = _a.sent();
                    console.log("Encoded with ID: ".concat(id1));
                    return [4 /*yield*/, encoder.decode("schema.org/MathematicalObject", id1)];
                case 2:
                    decoded1 = _a.sent();
                    console.log("Decoded:", decoded1);
                    test1Pass = decoded1.name === intrinsicPrimes.name &&
                        decoded1.description === intrinsicPrimes.description;
                    console.log("Test 1 (Simple object): ".concat(test1Pass ? 'PASS' : 'FAIL'));
                    relatedConcept = {
                        "@context": "https://schema.org",
                        "@type": "MathematicalObject",
                        "@id": "intrinsicPrimes-ref", // Use a different ID to avoid conflict with Test 1
                        "name": "Intrinsic Primes Referenced",
                        "description": "Referenced concept for testing"
                    };
                    return [4 /*yield*/, encoder.encode(relatedConcept, "schema.org/MathematicalObject")];
                case 3:
                    relatedId = _a.sent();
                    console.log("Encoded related concept with ID: ".concat(relatedId));
                    uniqueFactorization = {
                        "@context": "https://schema.org",
                        "@type": "MathematicalObject",
                        "@id": "uniqueFactorization",
                        "name": "Unique Factorization",
                        "relatedConcept": {
                            "@type": "MathematicalObject",
                            "@id": "intrinsicPrimes-ref", // This ID must match the one above
                            "name": "Intrinsic Primes Referenced", // Should match the name above
                            "description": "Referenced concept for testing" // Include description to match
                        }
                    };
                    return [4 /*yield*/, encoder.encode(uniqueFactorization, "schema.org/MathematicalObject")];
                case 4:
                    id2 = _a.sent();
                    console.log("Encoded main object with ID: ".concat(id2));
                    return [4 /*yield*/, encoder.decode("schema.org/MathematicalObject", id2)];
                case 5:
                    decoded2 = _a.sent();
                    console.log("Decoded with resolved references:", JSON.stringify(decoded2, null, 2));
                    // Verify the results
                    console.log('Expected main name:', uniqueFactorization.name);
                    console.log('Actual main name:', decoded2.name);
                    console.log('Expected related name:', relatedConcept.name);
                    console.log('Actual related name:', decoded2.relatedConcept ? decoded2.relatedConcept.name : 'undefined');
                    console.log('Expected related description:', relatedConcept.description);
                    console.log('Actual related description:', decoded2.relatedConcept ? decoded2.relatedConcept.description : 'undefined');
                    test2Pass = decoded2.name === uniqueFactorization.name &&
                        decoded2.relatedConcept &&
                        decoded2.relatedConcept.name === relatedConcept.name &&
                        decoded2.relatedConcept.description === relatedConcept.description;
                    console.log("Test 2 (Nested references): ".concat(test2Pass ? 'PASS' : 'FAIL'));
                    return [2 /*return*/, test1Pass && test2Pass];
            }
        });
    });
}
// Don't auto-run the test - we'll run it from runTest.js
