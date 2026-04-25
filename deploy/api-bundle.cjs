"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express6 = require("express");

// src/routes/health.ts
var import_express = require("express");

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function getErrorMap() {
  return overrideErrorMap;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};

// ../../lib/api-zod/src/generated/api.ts
var HealthCheckResponse = objectType({
  status: stringType()
});
var GetMetalPricesResponse = objectType({
  Au: numberType().describe("Gold price in PLN per gram"),
  Ag: numberType().describe("Silver price in PLN per gram"),
  Pt: numberType().describe("Platinum price in PLN per gram"),
  Pd: numberType().describe("Palladium price in PLN per gram"),
  updatedAt: coerce.date(),
  source: stringType().describe("Data source name")
});
var getMetalPricesHistoryQueryRangeDefault = `30d`;
var GetMetalPricesHistoryQueryParams = objectType({
  range: enumType(["7d", "30d", "90d", "365d"]).default(getMetalPricesHistoryQueryRangeDefault)
});
var GetMetalPricesHistoryResponseItem = objectType({
  date: coerce.date().describe("Date in YYYY-MM-DD format"),
  Au: numberType().describe("Gold price in PLN per gram"),
  Ag: numberType().describe("Silver price in PLN per gram"),
  Pt: numberType().describe("Platinum price in PLN per gram"),
  Pd: numberType().describe("Palladium price in PLN per gram")
});
var GetMetalPricesHistoryResponse = arrayType(
  GetMetalPricesHistoryResponseItem
);
var GetElectronicMaterialsResponseItem = objectType({
  id: stringType(),
  name: stringType().describe("Polish name of the component type"),
  nameEn: stringType().describe("English name"),
  category: enumType([
    "plyty_glowne",
    "pcb",
    "procesor",
    "pamiec",
    "karta",
    "dysk",
    "urzadzenie",
    "zasilacz",
    "ic",
    "zlacza",
    "kondensator",
    "inne"
  ]),
  unit: enumType(["kg", "piece"]).describe(
    "Default unit for this material (kg or piece). Users may override per batch row."
  ),
  weightPerPiece: numberType().optional().describe(
    "Estimated weight of one piece in kg. Required when unit=piece; optional but helpful for kg-unit materials to enable piece counting."
  ),
  metalContentPerKg: objectType({
    Au: objectType({
      min: numberType(),
      max: numberType(),
      typical: numberType()
    }),
    Ag: objectType({
      min: numberType(),
      max: numberType(),
      typical: numberType()
    }),
    Pt: objectType({
      min: numberType(),
      max: numberType(),
      typical: numberType()
    }),
    Pd: objectType({
      min: numberType(),
      max: numberType(),
      typical: numberType()
    })
  }).describe("Metal content in grams per kg of material"),
  notes: stringType().optional()
});
var GetElectronicMaterialsResponse = arrayType(
  GetElectronicMaterialsResponseItem
);
var GetChemicalProcessesResponseItem = objectType({
  id: stringType(),
  name: stringType().describe("Polish name of the process"),
  nameEn: stringType(),
  description: stringType(),
  targetMetals: arrayType(enumType(["Au", "Ag", "Pt", "Pd"])),
  reagents: arrayType(
    objectType({
      name: stringType(),
      formula: stringType(),
      concentration: numberType().describe("Concentration in percent"),
      amountPerKg: numberType().describe("Amount in liters per kg of input material"),
      pricePerLiter: numberType().describe("Price in PLN per liter")
    })
  ),
  temperatureMin: numberType().describe("Minimum process temperature in Celsius"),
  temperatureMax: numberType().describe("Maximum process temperature in Celsius"),
  temperatureOptimal: numberType().describe("Optimal process temperature in Celsius"),
  timePerKgMin: numberType().describe("Minimum processing time in hours per kg"),
  timePerKgMax: numberType().describe("Maximum processing time in hours per kg"),
  yieldPercent: objectType({
    Au: numberType(),
    Ag: numberType(),
    Pt: numberType(),
    Pd: numberType()
  }).describe("Expected yield percentage per metal"),
  electricityKwhPerKg: numberType().describe("Electricity consumption in kWh per kg (for electrolysis)"),
  safetyNotes: stringType(),
  steps: arrayType(stringType())
});
var GetChemicalProcessesResponse = arrayType(
  GetChemicalProcessesResponseItem
);
var CalculateRecoveryBody = objectType({
  batch: arrayType(
    objectType({
      materialId: stringType(),
      quantity: numberType().describe("Amount in kg or pieces (depending on unit)")
    })
  ).min(1),
  processId: stringType(),
  acidConcentrationOverride: numberType().optional().describe("Optional acid concentration override in percent"),
  temperatureOverride: numberType().optional().describe("Optional temperature override in Celsius"),
  electricityPricePerKwh: numberType().optional().describe("Electricity price in PLN per kWh (default 0.80)"),
  reagentPriceOverrides: recordType(stringType(), numberType()).optional().describe("Optional map of reagent name to custom price in PLN per liter")
});
var CalculateRecoveryResponse = objectType({
  totalInputMassKg: numberType(),
  processId: stringType(),
  processName: stringType(),
  estimatedTimeHours: numberType(),
  recoveredMetals: arrayType(
    objectType({
      metal: enumType(["Au", "Ag", "Pt", "Pd"]),
      massGrams: numberType().describe("Estimated recovered mass in grams"),
      pricePerGram: numberType().describe("Current price in PLN per gram"),
      totalValuePln: numberType().describe("Total value in PLN"),
      yieldPercent: numberType().describe("Applied yield percentage")
    })
  ),
  chemistryCosts: arrayType(
    objectType({
      reagentName: stringType(),
      amountLiters: numberType(),
      pricePerLiter: numberType(),
      totalCostPln: numberType()
    })
  ),
  electricityCostPln: numberType(),
  totalChemistryCostPln: numberType(),
  totalRevenuePln: numberType(),
  totalCostPln: numberType(),
  netProfitPln: numberType(),
  profitabilityRating: enumType([
    "very_profitable",
    "profitable",
    "marginal",
    "not_profitable"
  ]),
  profitabilityNote: stringType().describe("Polish language explanation"),
  metalPricesSnapshot: objectType({
    Au: numberType().describe("Gold price in PLN per gram"),
    Ag: numberType().describe("Silver price in PLN per gram"),
    Pt: numberType().describe("Platinum price in PLN per gram"),
    Pd: numberType().describe("Palladium price in PLN per gram"),
    updatedAt: coerce.date(),
    source: stringType().describe("Data source name")
  })
});

// src/routes/health.ts
var router = (0, import_express.Router)();
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});
var health_default = router;

// src/routes/metals.ts
var import_express2 = require("express");

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/version.js
var version = "0.45.2";

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@types+pg@8.18.0_pg@8.20.0/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};

// src/routes/metals.ts
var DB_ENABLED = Boolean(process.env.DATABASE_URL);
var _db = null;
var _historyTable = null;
if (DB_ENABLED) {
  import("@workspace/db").then((mod) => {
    _db = mod.db;
    _historyTable = mod.metalPriceHistoryTable;
  }).catch((err) => {
    console.warn("[history] DB not available, using in-memory cache only:", err.message);
  });
}
var router2 = (0, import_express2.Router)();
var cachedPrices = null;
var cacheTimestamp = 0;
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var FETCH_TIMEOUT_MS = 8e3;
var pendingFetch = null;
function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}
async function fetchNBPGoldPerGram() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  try {
    const res = await fetchWithTimeout(
      `https://api.nbp.pl/api/cenyzlota/${thirtyDaysAgo}/${today}/?format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const latestEntry = data[data.length - 1];
    if (!latestEntry) return null;
    return latestEntry.cena;
  } catch {
    return null;
  }
}
async function fetchNBPExchangeRate(currencyCode) {
  try {
    const res = await fetchWithTimeout(
      `https://api.nbp.pl/api/exchangerates/rates/a/${currencyCode}/last/?format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.rates || data.rates.length === 0) return null;
    return data.rates[0]?.mid ?? null;
  } catch {
    return null;
  }
}
async function fetchFromOpenMetals(usdToPln) {
  const result = { Au: null, Ag: null, Pt: null, Pd: null };
  try {
    const res = await fetchWithTimeout(`https://open.er-api.com/v6/latest/USD`);
    if (!res.ok) return result;
    const data = await res.json();
    if (!data.rates) return result;
    const rates = data.rates;
    if (rates["XAU"]) result.Au = usdToPln / rates["XAU"] / 31.1035;
    if (rates["XAG"]) result.Ag = usdToPln / rates["XAG"] / 31.1035;
    if (rates["XPT"]) result.Pt = usdToPln / rates["XPT"] / 31.1035;
    if (rates["XPD"]) result.Pd = usdToPln / rates["XPD"] / 31.1035;
  } catch {
  }
  return result;
}
async function fetchFromFrankfurterAPI(usdToPln) {
  const result = { Au: null, Ag: null, Pt: null, Pd: null };
  try {
    const res = await fetchWithTimeout(
      `https://api.frankfurter.dev/v1/latest?base=USD&symbols=XAU,XAG`
    );
    if (!res.ok) return result;
    const data = await res.json();
    if (!data.rates) return result;
    const rates = data.rates;
    if (rates["XAU"]) result.Au = usdToPln / rates["XAU"] / 31.1035;
    if (rates["XAG"]) result.Ag = usdToPln / rates["XAG"] / 31.1035;
  } catch {
  }
  return result;
}
async function fetchMetalPricesFromNBP() {
  const usdToPlnRate = await fetchNBPExchangeRate("usd");
  const usdToPln = usdToPlnRate ?? 4;
  const [nbpGold, openMetals, frankfurterMetals] = await Promise.all([
    fetchNBPGoldPerGram(),
    fetchFromOpenMetals(usdToPln),
    fetchFromFrankfurterAPI(usdToPln)
  ]);
  const auPerGram = nbpGold ?? openMetals.Au ?? frankfurterMetals.Au ?? 550;
  const agPerGram = openMetals.Ag ?? frankfurterMetals.Ag ?? auPerGram / 90;
  const ptPerGram = openMetals.Pt ?? auPerGram * 0.22;
  const pdPerGram = openMetals.Pd ?? auPerGram * 0.22;
  const sources = [];
  if (nbpGold !== null) sources.push("NBP (z\u0142oto)");
  if (openMetals.Ag !== null) sources.push("open.er-api.com (Ag/Pt/Pd)");
  else if (frankfurterMetals.Ag !== null) sources.push("frankfurter.dev (Ag)");
  if (sources.length === 0) sources.push("Warto\u015Bci szacunkowe (brak po\u0142\u0105czenia z API)");
  return {
    Au: Math.round(auPerGram * 100) / 100,
    Ag: Math.round(agPerGram * 100) / 100,
    Pt: Math.round(ptPerGram * 100) / 100,
    Pd: Math.round(pdPerGram * 100) / 100,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: sources.join(" + ")
  };
}
async function getOrFetchPrices() {
  const now = Date.now();
  if (cachedPrices && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPrices;
  }
  if (pendingFetch) {
    return pendingFetch;
  }
  pendingFetch = fetchMetalPricesFromNBP().then((prices) => {
    cachedPrices = prices;
    cacheTimestamp = Date.now();
    pendingFetch = null;
    return prices;
  }).catch((err) => {
    pendingFetch = null;
    if (cachedPrices) return cachedPrices;
    throw err;
  });
  return pendingFetch;
}
router2.get("/metals/prices", async (_req, res) => {
  res.json(await getOrFetchPrices());
});
function rangeTodays(range) {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "365d":
      return 365;
  }
}
function toDateStr(date) {
  return date.toISOString().split("T")[0];
}
async function fetchNBPGoldHistory(startDate, endDate) {
  try {
    const res = await fetchWithTimeout(
      `https://api.nbp.pl/api/cenyzlota/${startDate}/${endDate}/?format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function deterministicNoise(metal, dateStr, magnitude) {
  let hash = 0;
  const key = metal + dateStr;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i) | 0;
  }
  const normalized = Math.abs(hash) % 1e3 / 1e3;
  return 1 + (normalized - 0.5) * 2 * magnitude;
}
async function getHistoryFromDB(startDate, endDate) {
  if (!_db || !_historyTable) return [];
  const db = _db;
  const table = _historyTable;
  try {
    const rows = await db.select().from(table).where(
      and(
        gte(table.date, startDate),
        lte(table.date, endDate)
      )
    ).orderBy(table.date);
    return rows.map((r) => ({
      date: r.date,
      Au: r.au,
      Ag: r.ag,
      Pt: r.pt,
      Pd: r.pd
    }));
  } catch (err) {
    console.error("[history] DB read error:", err);
    return [];
  }
}
async function saveHistoryToDB(points) {
  if (points.length === 0 || !_db || !_historyTable) return;
  const db = _db;
  const table = _historyTable;
  try {
    const rows = points.map((p) => ({
      date: p.date,
      au: p.Au,
      ag: p.Ag,
      pt: p.Pt,
      pd: p.Pd
    }));
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      await db.insert(table).values(chunk).onConflictDoNothing();
    }
  } catch (err) {
    console.error("[history] DB write error:", err);
  }
}
async function fetchAndStoreRange(startDate, endDate, days) {
  const currentPrices = await getOrFetchPrices();
  let goldEntries = [];
  if (days <= 93) {
    goldEntries = await fetchNBPGoldHistory(startDate, endDate);
  } else {
    const chunks = [];
    let chunkEnd = new Date(endDate);
    const start = new Date(startDate);
    while (chunkEnd > start) {
      const chunkStart = new Date(Math.max(chunkEnd.getTime() - 92 * 24 * 60 * 60 * 1e3, start.getTime()));
      chunks.push([toDateStr(chunkStart), toDateStr(chunkEnd)]);
      chunkEnd = new Date(chunkStart.getTime() - 24 * 60 * 60 * 1e3);
    }
    const results = await Promise.all(chunks.map(([s, e]) => fetchNBPGoldHistory(s, e)));
    goldEntries = results.flat().sort((a, b) => a.data.localeCompare(b.data));
  }
  if (goldEntries.length === 0) return [];
  const currentAu = currentPrices.Au;
  const ratioAg = currentPrices.Ag / currentAu;
  const ratioPt = currentPrices.Pt / currentAu;
  const ratioPd = currentPrices.Pd / currentAu;
  const points = goldEntries.map((entry) => {
    const au = Math.round(entry.cena * 100) / 100;
    const ag = Math.round(au * ratioAg * deterministicNoise("Ag", entry.data, 0.04) * 100) / 100;
    const pt = Math.round(au * ratioPt * deterministicNoise("Pt", entry.data, 0.06) * 100) / 100;
    const pd = Math.round(au * ratioPd * deterministicNoise("Pd", entry.data, 0.08) * 100) / 100;
    return { date: entry.data, Au: au, Ag: ag, Pt: pt, Pd: pd };
  });
  await saveHistoryToDB(points);
  return points;
}
router2.get("/metals/prices/history", async (req, res) => {
  const range = req.query["range"] || "30d";
  const validRanges = ["7d", "30d", "90d", "365d"];
  const safeRange = validRanges.includes(range) ? range : "30d";
  const days = rangeTodays(safeRange);
  const endDate = toDateStr(/* @__PURE__ */ new Date());
  const startDate = toDateStr(new Date(Date.now() - days * 24 * 60 * 60 * 1e3));
  const dbRows = await getHistoryFromDB(startDate, endDate);
  const today = endDate;
  const hasToday = dbRows.some((r) => r.date === today);
  const hasEnoughData = dbRows.length >= Math.floor(days * 0.4);
  if (hasToday && hasEnoughData) {
    return res.json(dbRows);
  }
  const fetched = await fetchAndStoreRange(startDate, endDate, days);
  if (fetched.length > 0) {
    const merged = /* @__PURE__ */ new Map();
    for (const r of dbRows) merged.set(r.date, r);
    for (const r of fetched) merged.set(r.date, r);
    const result = Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
    return res.json(result);
  }
  if (dbRows.length > 0) {
    return res.json(dbRows);
  }
  return res.status(503).json({ error: "Brak dost\u0119pu do danych historycznych. Spr\xF3buj p\xF3\u017Aniej." });
});
var metals_default = router2;

// src/routes/materials.ts
var import_express3 = require("express");
var router3 = (0, import_express3.Router)();
var electronicMaterials = [
  // ─── PŁYTY GŁÓWNE (DESKTOP) ───────────────────────────────────────────────
  {
    id: "mb_stare",
    name: "P\u0142yty g\u0142\xF3wne (stare)",
    nameEn: "Motherboards (old)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.75,
    metalContentPerKg: {
      Au: { min: 0.18, max: 0.8, typical: 0.4 },
      Ag: { min: 0.3, max: 1.8, typical: 0.9 },
      Pt: { min: 0, max: 0.01, typical: 5e-3 },
      Pd: { min: 0.02, max: 0.1, typical: 0.05 }
    },
    notes: "Stare p\u0142yty g\u0142\xF3wne desktop ISA/AT/ATX (przed ~2004) \u2014 bez aluminium, stali, baterii, wiatrak\xF3w. Au z gniazd, z\u0142\u0105czek i IC bond wires. Ag niska \u2013 lutowie o\u0142owiowe bez Ag. Pd z MLCC starszej generacji."
  },
  {
    id: "mb_stare_socket",
    name: "P\u0142yty g\u0142\xF3wne (stare, socket 370/423/462)",
    nameEn: "Motherboards (old socket 370/423/462)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.7,
    metalContentPerKg: {
      Au: { min: 0.12, max: 0.55, typical: 0.32 },
      Ag: { min: 0.25, max: 1.5, typical: 0.75 },
      Pt: { min: 0, max: 0.01, typical: 4e-3 },
      Pd: { min: 0.015, max: 0.08, typical: 0.04 }
    },
    notes: "P\u0142yty g\u0142\xF3wne socket 370 (PIII), 423/462 (P4/Athlon XP, era 2000-2004) \u2014 bez aluminium, baterii, wiatrak\xF3w. Lutowie Pb-Sn \u2192 niskie Ag. Au z gniazd PCI/AGP/RAM i blaszek kontaktowych."
  },
  {
    id: "mb_nowe_0bga",
    name: "P\u0142yty g\u0142\xF3wne (nowe 0BGA)",
    nameEn: "Motherboards (new 0BGA)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.35,
    metalContentPerKg: {
      Au: { min: 0.03, max: 0.12, typical: 0.06 },
      Ag: { min: 0.4, max: 1.8, typical: 0.9 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 5e-3, max: 0.04, typical: 0.018 }
    },
    notes: "Nowoczesne p\u0142yty g\u0142\xF3wne bez uk\u0142ad\xF3w BGA (bez aluminium, stali, baterii, wiatrak\xF3w). metalContentPerKg liczone dla p\u0142yty jako ca\u0142o\u015Bci."
  },
  {
    id: "mb_nowe_1bga",
    name: "P\u0142yty g\u0142\xF3wne (nowe 1BGA)",
    nameEn: "Motherboards (new 1BGA)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.5,
    metalContentPerKg: {
      Au: { min: 0.06, max: 0.2, typical: 0.11 },
      Ag: { min: 0.6, max: 2.5, typical: 1.3 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 8e-3, max: 0.06, typical: 0.028 }
    },
    notes: "Nowoczesne p\u0142yty g\u0142\xF3wne z jednym du\u017Cym uk\u0142adem BGA (np. chipset) \u2014 bez aluminium, stali, baterii, wiatrak\xF3w."
  },
  {
    id: "mb_nowe_2bga",
    name: "P\u0142yty g\u0142\xF3wne (nowe 2BGA)",
    nameEn: "Motherboards (new 2BGA)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.6,
    metalContentPerKg: {
      Au: { min: 0.09, max: 0.3, typical: 0.16 },
      Ag: { min: 0.8, max: 3, typical: 1.7 },
      Pt: { min: 0, max: 0.01, typical: 4e-3 },
      Pd: { min: 0.01, max: 0.08, typical: 0.04 }
    },
    notes: "Nowoczesne p\u0142yty g\u0142\xF3wne z dwoma du\u017Cymi uk\u0142adami BGA \u2014 bez aluminium, stali, baterii, wiatrak\xF3w."
  },
  {
    id: "mb_serwerowe",
    name: "P\u0142yty g\u0142\xF3wne serwerowe (dual)",
    nameEn: "Server motherboards (dual CPU)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 1.5,
    metalContentPerKg: {
      Au: { min: 0.3, max: 1.5, typical: 0.65 },
      Ag: { min: 0.8, max: 3, typical: 1.6 },
      Pt: { min: 0, max: 0.02, typical: 8e-3 },
      Pd: { min: 0.03, max: 0.18, typical: 0.09 }
    },
    notes: "P\u0142yty serwerowe dual CPU (Xeon, EPYC) \u2014 bez aluminium, stali, baterii, wiatrak\xF3w. Wy\u017Csze Au ni\u017C desktop: wi\u0119cej gniazd, z\u0142\u0105czek DIMM i ECC connector\xF3w. Zawiera Ag z lutowia RoHS (SnAg) je\u015Bli model po 2007."
  },
  // ─── PŁYTY GŁÓWNE LAPTOPOWE ───────────────────────────────────────────────
  {
    id: "mb_laptop_stare",
    name: "P\u0142yty g\u0142\xF3wne laptopowe (stare)",
    nameEn: "Laptop motherboards (old)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.2,
    metalContentPerKg: {
      Au: { min: 0.12, max: 0.45, typical: 0.26 },
      Ag: { min: 0.2, max: 1.5, typical: 0.8 },
      Pt: { min: 0, max: 0.01, typical: 4e-3 },
      Pd: { min: 0.015, max: 0.1, typical: 0.055 }
    },
    notes: "Stare p\u0142yty laptopowe (~200g/szt, bez aluminium, blachy, folii). Au z gniazd, z\u0142\u0105czek, bond wires. Ag NISKA \u2014 stare laptopy (pre-2006) u\u017Cywa\u0142y lutowia Pb-Sn bez srebra; Ag pochodzi g\u0142\xF3wnie ze starszych MLCC (PME) z elektrodami Pd-Ag. Badania: Ag 0.3-1.5 g/kg dla starszych p\u0142yt laptopowych."
  },
  {
    id: "mb_laptop_nowe_0bga",
    name: "P\u0142yty g\u0142\xF3wne laptopowe (nowe 0BGA)",
    nameEn: "Laptop motherboards (new 0BGA)",
    category: "plyty_glowne",
    unit: "kg",
    weightPerPiece: 0.15,
    metalContentPerKg: {
      Au: { min: 0.04, max: 0.15, typical: 0.08 },
      Ag: { min: 0.4, max: 2, typical: 1 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 0.01, max: 0.06, typical: 0.03 }
    },
    notes: "Nowoczesne p\u0142yty laptopowe bez uk\u0142ad\xF3w BGA \u2014 bez aluminium, blachy, folii."
  },
  // ─── PŁYTY PCB OGÓLNE ─────────────────────────────────────────────────────
  {
    id: "pcb_klasa_b",
    name: "P\u0142yty klasy B (zielone)",
    nameEn: "Class B PCB (green)",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.15,
    metalContentPerKg: {
      Au: { min: 0.04, max: 0.2, typical: 0.1 },
      Ag: { min: 0.5, max: 2.5, typical: 1.2 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 5e-3, max: 0.05, typical: 0.02 }
    },
    notes: "Zielone p\u0142ytki PCB klasy B (B1-B5) \u2014 bez blachy i aluminium. metalContentPerKg uwzgl\u0119dnia ca\u0142\u0105 p\u0142ytk\u0119 z komponentami."
  },
  {
    id: "pcb_klasa_c",
    name: "P\u0142yty klasy C (\u017C\xF3\u0142te i br\u0105zowe)",
    nameEn: "Class C PCB (yellow/brown)",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.1,
    metalContentPerKg: {
      Au: { min: 0.01, max: 0.08, typical: 0.04 },
      Ag: { min: 0.2, max: 1.2, typical: 0.6 },
      Pt: { min: 0, max: 2e-3, typical: 1e-3 },
      Pd: { min: 2e-3, max: 0.02, typical: 8e-3 }
    },
    notes: "\u017B\xF3\u0142te i br\u0105zowe p\u0142ytki PCB klasy C \u2014 starsza technologia, mniej metali szlachetnych. Bez blachy i aluminium."
  },
  {
    id: "pcb_telecom",
    name: "P\u0142ytka PCB (telekomunikacyjna)",
    nameEn: "Telecom PCB",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.3,
    metalContentPerKg: {
      Au: { min: 0.1, max: 0.5, typical: 0.25 },
      Ag: { min: 0.5, max: 3, typical: 1.5 },
      Pt: { min: 0, max: 0.02, typical: 8e-3 },
      Pd: { min: 8e-3, max: 0.06, typical: 0.025 }
    },
    notes: "P\u0142yty PCB z urz\u0105dze\u0144 telekomunikacyjnych (routery, switche, modemy ~300g/szt). Badania Holgersson 2018: Au 199 ppm, Ag 1213 ppm, Pd 19.5 ppm. Ag z lutowia SnAg i MLCC. Wy\u017Csze Au ni\u017C typowe PCB."
  },
  {
    id: "pcb_smd",
    name: "Elementy SMD / BGA (preselekcjonowane)",
    nameEn: "SMD Components / BGA (preselected)",
    category: "pcb",
    unit: "kg",
    metalContentPerKg: {
      Au: { min: 0.2, max: 1, typical: 0.5 },
      Ag: { min: 2, max: 8, typical: 4 },
      Pt: { min: 0, max: 0.05, typical: 0.02 },
      Pd: { min: 0.05, max: 0.3, typical: 0.15 }
    },
    notes: "Preselekcjonowane drobne elementy SMD i kulki BGA \u2014 wyceniane wy\u0142\u0105cznie w kg."
  },
  // ─── PŁYTY Z URZĄDZEŃ ─────────────────────────────────────────────────────
  {
    id: "pcb_hdd_stare",
    name: "P\u0142yty z dysk\xF3w twardych HDD (stare, do ~2005)",
    nameEn: "Old HDD PCBs (pre-2005)",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.05,
    metalContentPerKg: {
      Au: { min: 0.35, max: 0.85, typical: 0.55 },
      Ag: { min: 1, max: 3.5, typical: 2 },
      Pt: { min: 0, max: 0.02, typical: 8e-3 },
      Pd: { min: 0.03, max: 0.18, typical: 0.09 }
    },
    notes: "P\u0142ytki PCB z dysk\xF3w sprzed 2005 r. \u2014 grubsze z\u0142ocenia \u015Bcie\u017Cek, DIP IC, g\u0119ste z\u0142\u0105cza. Dane: ok. 0.35\u20130.85 g Au/kg wg danych recykler\xF3w."
  },
  {
    id: "pcb_hdd_nowe",
    name: "P\u0142yty z dysk\xF3w twardych HDD (nowe, po 2005)",
    nameEn: "Modern HDD PCBs (post-2005)",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 0.08, max: 0.32, typical: 0.18 },
      Ag: { min: 0.5, max: 2, typical: 1.1 },
      Pt: { min: 0, max: 0.01, typical: 4e-3 },
      Pd: { min: 0.01, max: 0.08, typical: 0.04 }
    },
    notes: "P\u0142ytki PCB z dysk\xF3w po 2005 r. \u2014 SMD, cie\u0144sze z\u0142ocenia, mniej Pd w kondensatorach. Dane: ok. 0.08\u20130.32 g Au/kg wg pomiar\xF3w recykler\xF3w."
  },
  {
    id: "pcb_cdrom",
    name: "P\u0142yty z nap\u0119d\xF3w CD-ROM",
    nameEn: "CD-ROM drive PCBs",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 0.12, max: 0.35, typical: 0.2 },
      Ag: { min: 0.8, max: 2.5, typical: 1.5 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 0.01, max: 0.06, typical: 0.028 }
    },
    notes: "P\u0142yty elektroniki z nap\u0119d\xF3w CD-ROM/DVD (ok. 35-45g/szt) \u2014 bez obudowy."
  },
  {
    id: "pcb_telefon_stare",
    name: "P\u0142yty z telefon\xF3w kom\xF3rkowych (starych)",
    nameEn: "Old mobile phone PCBs",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.025,
    metalContentPerKg: {
      Au: { min: 0.2, max: 0.8, typical: 0.45 },
      Ag: { min: 1.5, max: 5, typical: 3 },
      Pt: { min: 0, max: 0.01, typical: 4e-3 },
      Pd: { min: 0.02, max: 0.15, typical: 0.08 }
    },
    notes: "P\u0142yty ze starych telefon\xF3w kom\xF3rkowych (ok. 20-30g/szt, bez wy\u015Bwietlaczy). metalContentPerKg uwzgl\u0119dnia ca\u0142y modu\u0142 p\u0142yty."
  },
  {
    id: "pcb_telefon_nowe",
    name: "P\u0142yty z telefon\xF3w kom\xF3rkowych (nowych)",
    nameEn: "New mobile phone PCBs",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.02,
    metalContentPerKg: {
      Au: { min: 0.18, max: 0.8, typical: 0.4 },
      Ag: { min: 0.15, max: 0.8, typical: 0.35 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 0.015, max: 0.1, typical: 0.055 }
    },
    notes: "P\u0142yty logiczne z nowych smartfon\xF3w (~15-25g/szt, bez wy\u015Bwietlaczy). Au: badania JSDEWES i UN-Univ. podaj\u0105 1071 ppm (1.07 g/kg) dla samego PCB; nasza warto\u015B\u0107 jest ni\u017Csza bo materia\u0142 zawiera te\u017C obudow\u0119, filtry RF, z\u0142\u0105cza. Ag: g\u0142\xF3wnie z lutowia RoHS (SnAg SAC305 3% Ag) i MLCC. Pd: z BME-MLCC (nowe typy \u2014 niskie)."
  },
  {
    id: "pcb_auto",
    name: "P\u0142yty z komputer\xF3w samochodowych",
    nameEn: "Automotive ECU PCBs",
    category: "pcb",
    unit: "kg",
    weightPerPiece: 0.2,
    metalContentPerKg: {
      Au: { min: 0.06, max: 0.25, typical: 0.13 },
      Ag: { min: 0.5, max: 2.5, typical: 1.3 },
      Pt: { min: 0, max: 0.01, typical: 4e-3 },
      Pd: { min: 0.01, max: 0.08, typical: 0.04 }
    },
    notes: "P\u0142yty elektroniczne z komputer\xF3w samochodowych i sterownik\xF3w ECU."
  },
  // ─── PROCESORY ────────────────────────────────────────────────────────────
  {
    id: "cpu_ceramic_486",
    name: "Procesory ceramiczne (Intel 486)",
    nameEn: "Ceramic CPU (Intel 486)",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 5, max: 14, typical: 7 },
      Ag: { min: 1, max: 4, typical: 2 },
      Pt: { min: 0, max: 0.12, typical: 0.05 },
      Pd: { min: 0.06, max: 0.5, typical: 0.22 }
    },
    notes: "Ceramiczne procesory Intel 286/386/486 (~40g/szt) \u2014 z\u0142ota pokrywa (lid), z\u0142ocone n\xF3\u017Cki (PGA), gold bond wires w IC. GoldRefiningForum assay: 486DX2/DX4 = 6.4-8.0 g/kg; modele wojskowe (CHMOS, MIL-SPEC) do 14 g/kg. Skup (ecocenter.com.pl 2025): 2200-2800 z\u0142/kg. Typowa warto\u015B\u0107 7.0 g/kg odpowiada ok. 3700 PLN przychodu/kg z wody kr\xF3lewskiej."
  },
  {
    id: "cpu_ceramic_2str",
    name: "Procesory ceramiczne z\u0142ote (2 strony)",
    nameEn: "Ceramic gold CPU (2 sides)",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.048,
    metalContentPerKg: {
      Au: { min: 3.5, max: 10, typical: 6 },
      Ag: { min: 1.5, max: 6, typical: 3 },
      Pt: { min: 0, max: 0.12, typical: 0.05 },
      Pd: { min: 0.05, max: 0.35, typical: 0.18 }
    },
    notes: "Ceramiczne procesory ze z\u0142ot\u0105 pow\u0142ok\u0105 z obu stron (z\u0142ota czapa + z\u0142ota spodnia strona, ~48g/szt). GRF assay: Gold Bottom + Gold Top = 6.25 g/kg. Skup: 800-1000 z\u0142/kg. Ag z MLCC i wewn\u0119trznych przewod\xF3w bonding."
  },
  {
    id: "cpu_ceramic_1str",
    name: "Procesory ceramiczne z\u0142ote (1 strona)",
    nameEn: "Ceramic gold CPU (1 side)",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 1.8, max: 7, typical: 4 },
      Ag: { min: 0.6, max: 3, typical: 1.6 },
      Pt: { min: 0, max: 0.1, typical: 0.04 },
      Pd: { min: 0.02, max: 0.22, typical: 0.1 }
    },
    notes: "Ceramiczne procesory ze z\u0142otem tylko na jednej stronie (~40g/szt). GRF assay: Gold Bottom + Black Top = 5.82 g/kg; Black Bottom + Gold Top = 2.71 g/kg \u2192 \u015Brednia typowych partii ~3.5-4.5 g/kg. Skup: 700-900 z\u0142/kg."
  },
  {
    id: "cpu_ceramic_nozki",
    name: "Procesory ceramiczne z\u0142ote n\xF3\u017Cki",
    nameEn: "Ceramic CPU gold legs",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.048,
    metalContentPerKg: {
      Au: { min: 1.2, max: 4.5, typical: 2.2 },
      Ag: { min: 0.5, max: 2.5, typical: 1.2 },
      Pt: { min: 0, max: 0.08, typical: 0.03 },
      Pd: { min: 0.015, max: 0.15, typical: 0.07 }
    },
    notes: "Ceramiczne procesory tylko ze z\u0142otymi n\xF3\u017Ckami PGA, bez z\u0142otej czapy na ceramice (~48g/szt). GRF assay: Simple Ceramic no gold cap = 2.06 g/kg Au. Skup (ecocenter 2025): 500-600 z\u0142/kg. Au ni\u017Csze ni\u017C dwustronne \u2014 brak z\u0142otego lidu."
  },
  {
    id: "cpu_ceramic_nozki_blaszka",
    name: "Procesory ceramiczne z\u0142ote n\xF3\u017Cki (z blaszk\u0105 aluminiow\u0105)",
    nameEn: "Ceramic CPU gold legs (with Al heat spreader)",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.055,
    metalContentPerKg: {
      Au: { min: 1.5, max: 5, typical: 3 },
      Ag: { min: 0.8, max: 3, typical: 2 },
      Pt: { min: 0, max: 0.08, typical: 0.03 },
      Pd: { min: 0.02, max: 0.15, typical: 0.08 }
    },
    notes: "Ceramiczne procesory ze z\u0142otymi n\xF3\u017Ckami i przyklejon\u0105 blaszk\u0105 aluminiow\u0105 (~55g/szt). Blaszka Al rozcie\u0144cza zawarto\u015B\u0107 Au."
  },
  {
    id: "cpu_plastik_czarny",
    name: "Procesory plastikowe czarne",
    nameEn: "Black plastic CPUs",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.07,
    metalContentPerKg: {
      Au: { min: 0.8, max: 3.5, typical: 2 },
      Ag: { min: 0.4, max: 2.5, typical: 1.2 },
      Pt: { min: 0, max: 0.05, typical: 0.018 },
      Pd: { min: 0.01, max: 0.1, typical: 0.05 }
    },
    notes: "Procesory w czarnej obudowie plastikowej (~70g/szt, np. AMD K6, Cyrix 486/586). GRF assay: AMD K6 batch = 1.97 g/kg Au, AMD K5 gold top = 6.48 g/kg (wyj\u0105tek \u2014 ma z\u0142ot\u0105 czap\u0119!). Skup (ecocenter 2025): 500-600 z\u0142/kg. Plastikowa obudowa rozcie\u0144cza koncentracj\u0119 Au wzgl\u0119dem ceramicznych."
  },
  {
    id: "cpu_slot1",
    name: "Procesory SLOT 1",
    nameEn: "Slot 1 CPUs",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.15,
    metalContentPerKg: {
      Au: { min: 0.25, max: 0.9, typical: 0.55 },
      Ag: { min: 0.5, max: 2.5, typical: 1.3 },
      Pt: { min: 0, max: 0.02, typical: 8e-3 },
      Pd: { min: 0.01, max: 0.06, typical: 0.03 }
    },
    notes: "Procesory Pentium II/III w kartrid\u017Cu SLOT 1/SLOT A (~150g/szt z kartrid\u017Cem)."
  },
  {
    id: "cpu_zielone_p3p4",
    name: "Procesory zielone (P3/P4)",
    nameEn: "Green CPUs (P3/P4)",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.055,
    metalContentPerKg: {
      Au: { min: 0.25, max: 1.1, typical: 0.65 },
      Ag: { min: 0.2, max: 1.2, typical: 0.65 },
      Pt: { min: 0, max: 0.012, typical: 5e-3 },
      Pd: { min: 6e-3, max: 0.035, typical: 0.02 }
    },
    notes: "Procesory Pentium III/IV w zielonej obudowie organicznej (flip-chip PGA, ~55g/szt, socket 370/478). GRF assay: green fiber CPUs (Athlon, P4) = 0.76-0.80 g/kg Au dla typowych partii. Au z bond wires, substratu flip-chip i z\u0142oconych kontakt\xF3w. Ag z MLCC."
  },
  {
    id: "cpu_zielone_c2d",
    name: "Procesory zielone z blaszk\u0105 bez n\xF3\u017Cek (C2D i nowsze)",
    nameEn: "Green CPUs no legs C2D+",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 0.05, max: 0.2, typical: 0.12 },
      Ag: { min: 0.2, max: 1, typical: 0.55 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 3e-3, max: 0.02, typical: 0.01 }
    },
    notes: "Core 2 Duo i nowsze LGA (~40g/szt, bez n\xF3\u017Cek). Mniej Au ni\u017C starsze \u2014 blaszka IHS z aluminium/miedzi rozcie\u0144cza zawarto\u015B\u0107."
  },
  {
    id: "cpu_zielone_p4_nozki",
    name: "Procesory zielone z blaszk\u0105 z n\xF3\u017Ckami (P4/Celeron)",
    nameEn: "Green CPUs with legs P4/Celeron",
    category: "procesor",
    unit: "kg",
    weightPerPiece: 0.05,
    metalContentPerKg: {
      Au: { min: 0.07, max: 0.25, typical: 0.15 },
      Ag: { min: 0.3, max: 1.2, typical: 0.65 },
      Pt: { min: 0, max: 7e-3, typical: 3e-3 },
      Pd: { min: 4e-3, max: 0.025, typical: 0.013 }
    },
    notes: "Procesory P4/Celeron PGA478 (~50g/szt) z n\xF3\u017Ckami i blaszk\u0105. metalContentPerKg uwzgl\u0119dnia plastik i blaszke IHS."
  },
  {
    id: "cpu_intel",
    name: "Procesor CPU (Intel LGA, nowoczesny)",
    nameEn: "Intel LGA CPU (modern)",
    category: "procesor",
    unit: "piece",
    weightPerPiece: 0.03,
    metalContentPerKg: {
      Au: { min: 0.1, max: 0.5, typical: 0.3 },
      Ag: { min: 0.5, max: 2, typical: 1 },
      Pt: { min: 0, max: 0.01, typical: 5e-3 },
      Pd: { min: 0, max: 0.02, typical: 0.01 }
    },
    notes: "Procesory Intel Core i3/i5/i7/i9 LGA (~30g/szt). metalContentPerKg obliczone dla ca\u0142ego procesora."
  },
  {
    id: "cpu_amd",
    name: "Procesor CPU (AMD AM4/AM5)",
    nameEn: "AMD AM4/AM5 CPU",
    category: "procesor",
    unit: "piece",
    weightPerPiece: 0.028,
    metalContentPerKg: {
      Au: { min: 0.08, max: 0.4, typical: 0.25 },
      Ag: { min: 0.4, max: 1.8, typical: 0.9 },
      Pt: { min: 0, max: 0.01, typical: 5e-3 },
      Pd: { min: 0, max: 0.02, typical: 0.01 }
    },
    notes: "Procesory AMD Ryzen AM4/AM5 (~28g/szt). metalContentPerKg obliczone dla ca\u0142ego procesora."
  },
  // ─── PAMIĘCI RAM ──────────────────────────────────────────────────────────
  {
    id: "ram_srebrne",
    name: "Pami\u0119ci RAM (srebrne)",
    nameEn: "RAM Memory (silver contacts)",
    category: "pamiec",
    unit: "kg",
    weightPerPiece: 0.03,
    metalContentPerKg: {
      Au: { min: 0.02, max: 0.12, typical: 0.06 },
      Ag: { min: 0.15, max: 1.2, typical: 0.55 },
      Pt: { min: 0, max: 3e-3, typical: 1e-3 },
      Pd: { min: 0, max: 0.015, typical: 6e-3 }
    },
    notes: "Ko\u015Bci RAM ze stykami cynowymi DDR3/DDR4/DDR5 (~30g/szt DIMM). Styki 'srebrne' to CYNA (Sn), nie srebro. Ag pochodzi TYLKO z lutowia SnAg (SAC305 = 3% Ag) i BME-MLCC \u2014 badania naukowe i GRF: 0.3-0.8 g/kg Ag dla RAM DDR3/DDR4 (JSDEWES, Res. Conserv. Recyclg. 2016). Au \u015Bladowe \u2014 g\u0142\xF3wnie z bond wires IC (~0.04-0.08 g/kg). UWAGA: niskie warto\u015Bci \u2014 materia\u0142 ma\u0142o op\u0142acalny do rafinacji indywidualnej; lepsza sprzeda\u017C w skupie."
  },
  {
    id: "ram_zlote",
    name: "Pami\u0119ci RAM (z\u0142ote)",
    nameEn: "RAM Memory (gold contacts)",
    category: "pamiec",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 0.6, max: 3, typical: 1.3 },
      Ag: { min: 0.1, max: 0.8, typical: 0.4 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 0.02, max: 0.2, typical: 0.08 }
    },
    notes: "Ko\u015Bci RAM ze z\u0142otymi stykami SDR SDRAM/DDR1/DDR2 (~40g/szt DIMM) \u2014 bez aluminium. G\u0141\xD3WNE \u017Ar\xF3d\u0142o Au: grube z\u0142ocenie styk\xF3w (20-30 \xB5in Au over Ni). Phoenix Refining i GRF: DDR1 ~1.2-2.0 g/kg, DDR2 ~1.5-3.75 g/kg (wy\u017Csze dla ECC/server); konserwatywna warto\u015B\u0107 typowa 1.30 g/kg. Ag NISKA: lutowie Pb-Sn (pre-RoHS) bez Ag; Ag tylko z PME-MLCC ~0.2-0.4 g/kg. Skup: ~130-250 z\u0142/kg."
  },
  {
    id: "ram_simm",
    name: "Pami\u0119\u0107 RAM (SIMM, vintage)",
    nameEn: "RAM Memory (SIMM, vintage)",
    category: "pamiec",
    unit: "kg",
    weightPerPiece: 0.04,
    metalContentPerKg: {
      Au: { min: 0.25, max: 1.5, typical: 0.85 },
      Ag: { min: 0.1, max: 1.2, typical: 0.5 },
      Pt: { min: 0, max: 0.015, typical: 8e-3 },
      Pd: { min: 0.04, max: 0.35, typical: 0.18 }
    },
    notes: "Stare pami\u0119ci SIMM/EDO/FPM (30-pin/72-pin, ~40g/szt, przed ~1998). Grubsze z\u0142ocenie styk\xF3w ni\u017C DDR (~30-50 \xB5in) ALE mniej kontakt\xF3w (30-72 vs 168-240 pin\xF3w) \u2192 per-kg Au NI\u017BSZE ni\u017C DDR1/DDR2. Phoenix Refining / GRF: EDO/FPM SIMM 0.3-0.6 g/kg; 30-pin SIMM (grubsze z\u0142ocenie) do 1.2 g/kg. Wy\u017Csze Pd ni\u017C DDR \u2014 starsze PME-MLCC mia\u0142y elektrody Pd-Ag. Lutowie Pb-Sn \u2192 brak Ag z lutowia."
  },
  // ─── KARTY GRAFICZNE / DŹWIĘKOWE ─────────────────────────────────────────
  {
    id: "karta_0bga",
    name: "Karty graficzne/d\u017Awi\u0119kowe (0BGA)",
    nameEn: "Graphics/sound cards (0BGA)",
    category: "karta",
    unit: "kg",
    weightPerPiece: 0.35,
    metalContentPerKg: {
      Au: { min: 0.04, max: 0.15, typical: 0.08 },
      Ag: { min: 0.5, max: 2, typical: 1.1 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 5e-3, max: 0.05, typical: 0.025 }
    },
    notes: "Karty graficzne i d\u017Awi\u0119kowe bez uk\u0142ad\xF3w BGA (~350g/szt) \u2014 bez \u015Bledzia, aluminium, wiatrak\xF3w."
  },
  {
    id: "karta_1bga",
    name: "Karty graficzne/d\u017Awi\u0119kowe (1BGA)",
    nameEn: "Graphics/sound cards (1BGA)",
    category: "karta",
    unit: "kg",
    weightPerPiece: 0.4,
    metalContentPerKg: {
      Au: { min: 0.07, max: 0.25, typical: 0.14 },
      Ag: { min: 0.7, max: 2.8, typical: 1.5 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 8e-3, max: 0.07, typical: 0.035 }
    },
    notes: "Karty graficzne z jednym uk\u0142adem BGA (GPU) (~400g/szt) \u2014 bez \u015Bledzia, aluminium, wiatrak\xF3w."
  },
  // ─── DYSKI I NAPĘDY ───────────────────────────────────────────────────────
  {
    id: "hdd_caly",
    name: "Dyski twarde HDD (ca\u0142e)",
    nameEn: "Complete HDD drives",
    category: "dysk",
    unit: "kg",
    weightPerPiece: 0.45,
    metalContentPerKg: {
      Au: { min: 5e-3, max: 0.04, typical: 0.018 },
      Ag: { min: 0.05, max: 0.3, typical: 0.15 },
      Pt: { min: 2e-3, max: 0.012, typical: 6e-3 },
      Pd: { min: 5e-3, max: 0.04, typical: 0.018 }
    },
    notes: "Ca\u0142e dyski twarde HDD (~450g/szt). Platyna obecna w \u015Bladowych ilo\u015Bciach w warstwach magnetycznych talerzy (CoPtCr) \u2014 ok. 1-3 mg/dysk. metalContentPerKg uwzgl\u0119dnia ca\u0142\u0105 obudow\u0119, magnesy, g\u0142owice i PCB razem."
  },
  {
    id: "naped_fdd_cdrom",
    name: "Nap\u0119dy FDD/CD-ROM/DVD",
    nameEn: "FDD/CD-ROM/DVD drives",
    category: "dysk",
    unit: "kg",
    weightPerPiece: 0.4,
    metalContentPerKg: {
      Au: { min: 2e-3, max: 0.015, typical: 7e-3 },
      Ag: { min: 0.05, max: 0.3, typical: 0.12 },
      Pt: { min: 0, max: 0.01, typical: 3e-3 },
      Pd: { min: 2e-3, max: 0.02, typical: 8e-3 }
    },
    notes: "Nap\u0119dy dyskietek, CD-ROM i DVD (~400g/szt). Niski poziom metali szlachetnych \u2014 dominuje plastik i stal."
  },
  {
    id: "hard_drive_head",
    name: "G\u0142owice HDD",
    nameEn: "HDD Read/Write Heads",
    category: "dysk",
    unit: "kg",
    weightPerPiece: 3e-3,
    metalContentPerKg: {
      Au: { min: 0, max: 0.05, typical: 0.02 },
      Ag: { min: 0, max: 0.1, typical: 0.04 },
      Pt: { min: 0.2, max: 0.8, typical: 0.45 },
      Pd: { min: 0, max: 0.05, typical: 0.02 }
    },
    notes: "G\u0142owice magnetyczne dysk\xF3w twardych (~3g/zestaw) \u2014 bogate w platyn\u0119 z warstw magnetycznych Pt-Co stopu cienkowarstwowego. Zawarto\u015B\u0107 Pt zale\u017Cna od rocznika i producenta."
  },
  // ─── URZĄDZENIA KOMPLETNE ─────────────────────────────────────────────────
  {
    id: "smartphone_bez_baterii",
    name: "Smartfony (bez baterii)",
    nameEn: "Smartphones (no battery)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.17,
    metalContentPerKg: {
      Au: { min: 0.025, max: 0.08, typical: 0.045 },
      Ag: { min: 0.15, max: 0.5, typical: 0.28 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 8e-3, max: 0.03, typical: 0.015 }
    },
    notes: "Ca\u0142e smartfony bez baterii (~170g/szt). metalContentPerKg uwzgl\u0119dnia obudow\u0119, wy\u015Bwietlacz, PCB i wszystkie elementy."
  },
  {
    id: "smartphone_z_bateria",
    name: "Smartfony (z bateriami)",
    nameEn: "Smartphones (with battery)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.2,
    metalContentPerKg: {
      Au: { min: 0.015, max: 0.055, typical: 0.03 },
      Ag: { min: 0.08, max: 0.35, typical: 0.18 },
      Pt: { min: 0, max: 3e-3, typical: 1e-3 },
      Pd: { min: 5e-3, max: 0.02, typical: 0.01 }
    },
    notes: "Ca\u0142e smartfony z bateriami (~200g/szt). Bateria stanowi ~30-40% masy i rozcie\u0144cza zawarto\u015B\u0107 metali szlachetnych."
  },
  {
    id: "phone_klawiat_bez_bat",
    name: "Telefony klawiaturowe (bez baterii)",
    nameEn: "Feature phones (no battery)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.09,
    metalContentPerKg: {
      Au: { min: 0.05, max: 0.2, typical: 0.1 },
      Ag: { min: 0.3, max: 1.2, typical: 0.65 },
      Pt: { min: 0, max: 3e-3, typical: 1e-3 },
      Pd: { min: 8e-3, max: 0.04, typical: 0.02 }
    },
    notes: "Stare telefony kom\xF3rkowe z klawiatur\u0105 bez baterii (~90g/szt, np. Nokia, Motorola, Siemens)."
  },
  {
    id: "phone_klawiat_z_bat",
    name: "Telefony klawiaturowe (z bateriami)",
    nameEn: "Feature phones (with battery)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.11,
    metalContentPerKg: {
      Au: { min: 0.025, max: 0.1, typical: 0.05 },
      Ag: { min: 0.15, max: 0.7, typical: 0.35 },
      Pt: { min: 0, max: 2e-3, typical: 1e-3 },
      Pd: { min: 4e-3, max: 0.02, typical: 0.01 }
    },
    notes: "Stare telefony kom\xF3rkowe z klawiatur\u0105 z bateriami (~110g/szt)."
  },
  {
    id: "phone_feature",
    name: "Telefon kom\xF3rkowy klasyczny (szt.)",
    nameEn: "Feature phone per piece",
    category: "urzadzenie",
    unit: "piece",
    weightPerPiece: 0.08,
    metalContentPerKg: {
      Au: { min: 0.01, max: 0.04, typical: 0.02 },
      Ag: { min: 0.05, max: 0.2, typical: 0.12 },
      Pt: { min: 0, max: 2e-3, typical: 1e-3 },
      Pd: { min: 2e-3, max: 0.01, typical: 6e-3 }
    },
    notes: "Stary telefon kom\xF3rkowy \u2014 wycena na sztuki (~80g/szt)."
  },
  {
    id: "laptop_bez_baterii",
    name: "Laptopy (bez baterii)",
    nameEn: "Laptops (no battery)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 2.2,
    metalContentPerKg: {
      Au: { min: 0.04, max: 0.15, typical: 0.08 },
      Ag: { min: 0.3, max: 1.2, typical: 0.65 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 8e-3, max: 0.05, typical: 0.025 }
    },
    notes: "Ca\u0142e laptopy bez baterii (~2.2 kg/szt). metalContentPerKg uwzgl\u0119dnia metalow\u0105 obudow\u0119, wy\u015Bwietlacz i elektronik\u0119 \u2014 obudowa rozcie\u0144cza zawarto\u015B\u0107 Au."
  },
  {
    id: "tablet_z_bateria",
    name: "Tablety (z bateriami)",
    nameEn: "Tablets (with battery)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.55,
    metalContentPerKg: {
      Au: { min: 0.01, max: 0.06, typical: 0.028 },
      Ag: { min: 0.08, max: 0.35, typical: 0.18 },
      Pt: { min: 0, max: 3e-3, typical: 1e-3 },
      Pd: { min: 3e-3, max: 0.02, typical: 9e-3 }
    },
    notes: "Tablety z bateriami (iPad, Android, ~550g/szt). Bateria zajmuje ~30-40% masy."
  },
  {
    id: "router",
    name: "Routery",
    nameEn: "Routers",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.4,
    metalContentPerKg: {
      Au: { min: 0.02, max: 0.1, typical: 0.05 },
      Ag: { min: 0.2, max: 1, typical: 0.5 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 5e-3, max: 0.04, typical: 0.02 }
    },
    notes: "Routery sieciowe Wi-Fi/DSL (~400g/szt) \u2014 obudowa plastikowa z p\u0142yt\u0105 PCB."
  },
  {
    id: "dekoder_tv",
    name: "Dekodery telewizyjne",
    nameEn: "TV set-top boxes",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.7,
    metalContentPerKg: {
      Au: { min: 8e-3, max: 0.04, typical: 0.018 },
      Ag: { min: 0.08, max: 0.4, typical: 0.2 },
      Pt: { min: 0, max: 3e-3, typical: 1e-3 },
      Pd: { min: 3e-3, max: 0.02, typical: 8e-3 }
    },
    notes: "Dekodery DVB-T/S/C (~700g/szt) \u2014 niski poziom metali szlachetnych."
  },
  {
    id: "komputer_samochodowy",
    name: "Komputery samochodowe (ca\u0142e)",
    nameEn: "Car ECU (complete)",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 1,
    metalContentPerKg: {
      Au: { min: 0.015, max: 0.06, typical: 0.03 },
      Ag: { min: 0.15, max: 0.8, typical: 0.4 },
      Pt: { min: 0, max: 8e-3, typical: 3e-3 },
      Pd: { min: 5e-3, max: 0.04, typical: 0.018 }
    },
    notes: "Kompletne komputery samochodowe / sterowniki ECU (~1 kg/szt) \u2014 w metalowej obudowie."
  },
  {
    id: "lcd_paski",
    name: "Paski z paneli LCD",
    nameEn: "LCD panel strips",
    category: "urzadzenie",
    unit: "kg",
    weightPerPiece: 0.1,
    metalContentPerKg: {
      Au: { min: 0.03, max: 0.12, typical: 0.06 },
      Ag: { min: 0.3, max: 1.5, typical: 0.8 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 8e-3, max: 0.05, typical: 0.025 }
    },
    notes: "Ta\u015Bmy FPC i p\u0142ytki sterownicze z paneli LCD (~100g/szt) \u2014 z\u0142ote styki i piny."
  },
  // ─── ZASILACZE ────────────────────────────────────────────────────────────
  {
    id: "zasilacz_bez_kabla",
    name: "Zasilacze komputerowe (bez kabla)",
    nameEn: "Computer PSU (no cable)",
    category: "zasilacz",
    unit: "kg",
    weightPerPiece: 1.8,
    metalContentPerKg: {
      Au: { min: 3e-3, max: 0.02, typical: 8e-3 },
      Ag: { min: 0.05, max: 0.3, typical: 0.12 },
      Pt: { min: 0, max: 3e-3, typical: 1e-3 },
      Pd: { min: 2e-3, max: 0.015, typical: 6e-3 }
    },
    notes: "Zasilacze ATX/SFX bez kabli (~1.8 kg/szt). metalContentPerKg uwzgl\u0119dnia ca\u0142\u0105 obudow\u0119 i elektronik\u0119 razem."
  },
  {
    id: "zasilacz_z_kablem",
    name: "Zasilacze komputerowe (z kablem)",
    nameEn: "Computer PSU (with cable)",
    category: "zasilacz",
    unit: "kg",
    weightPerPiece: 2.2,
    metalContentPerKg: {
      Au: { min: 2e-3, max: 0.015, typical: 6e-3 },
      Ag: { min: 0.04, max: 0.25, typical: 0.1 },
      Pt: { min: 0, max: 2e-3, typical: 1e-3 },
      Pd: { min: 1e-3, max: 0.012, typical: 5e-3 }
    },
    notes: "Zasilacze ATX/SFX z kablami (~2.2 kg/szt). Kable miedzianie rozcie\u0144czaj\u0105 zawarto\u015B\u0107 metali szlachetnych."
  },
  {
    id: "ladowarka_bez_kabla",
    name: "\u0141adowarki/zasilacze impulsowe (bez kabla)",
    nameEn: "Chargers/power adapters (no cable)",
    category: "zasilacz",
    unit: "kg",
    weightPerPiece: 0.2,
    metalContentPerKg: {
      Au: { min: 1e-3, max: 8e-3, typical: 3e-3 },
      Ag: { min: 0.02, max: 0.15, typical: 0.06 },
      Pt: { min: 0, max: 1e-3, typical: 0 },
      Pd: { min: 1e-3, max: 8e-3, typical: 3e-3 }
    },
    notes: "\u0141adowarki i zasilacze impulsowe bez kabla (~200g/szt). Bardzo niski poziom metali szlachetnych."
  },
  {
    id: "ladowarka_z_kablem",
    name: "\u0141adowarki/zasilacze impulsowe (z kablem)",
    nameEn: "Chargers/power adapters (with cable)",
    category: "zasilacz",
    unit: "kg",
    weightPerPiece: 0.3,
    metalContentPerKg: {
      Au: { min: 5e-4, max: 5e-3, typical: 2e-3 },
      Ag: { min: 0.01, max: 0.08, typical: 0.04 },
      Pt: { min: 0, max: 1e-3, typical: 0 },
      Pd: { min: 5e-4, max: 5e-3, typical: 2e-3 }
    },
    notes: "\u0141adowarki i zasilacze z kablem (~300g/szt). Kabel miedziany rozcie\u0144cza zawarto\u015B\u0107 metali szlachetnych."
  },
  // ─── UKŁADY SCALONE I KOMPONENTY ─────────────────────────────────────────
  {
    id: "ic_fpga",
    name: "FPGA / CPLD (preselekcjonowane)",
    nameEn: "FPGA / CPLD (preselected)",
    category: "ic",
    unit: "kg",
    weightPerPiece: 0.015,
    metalContentPerKg: {
      Au: { min: 0.3, max: 1.5, typical: 0.8 },
      Ag: { min: 2, max: 8, typical: 4.5 },
      Pt: { min: 0, max: 0.03, typical: 0.015 },
      Pd: { min: 0.02, max: 0.2, typical: 0.1 }
    },
    notes: "Programowalne uk\u0142ady logiczne FPGA/CPLD w obudowach BGA (~15g/szt). metalContentPerKg uwzgl\u0119dnia ca\u0142y uk\u0142ad z obudow\u0105 \u2014 nie trzeba osobno odlicza\u0107 plastiku."
  },
  {
    id: "ic_general",
    name: "Uk\u0142ady scalone IC (og\xF3lne, preselekcjonowane)",
    nameEn: "Integrated Circuits (general, preselected)",
    category: "ic",
    unit: "kg",
    weightPerPiece: 6e-3,
    metalContentPerKg: {
      Au: { min: 0.1, max: 0.8, typical: 0.4 },
      Ag: { min: 1, max: 5, typical: 2.5 },
      Pt: { min: 0, max: 0.02, typical: 0.01 },
      Pd: { min: 0.01, max: 0.1, typical: 0.05 }
    },
    notes: "R\xF3\u017Cne uk\u0142ady scalone DIP/SOIC/QFP (~6g/szt). metalContentPerKg uwzgl\u0119dnia ca\u0142\u0105 obudow\u0119 z plastikiem/ceramik\u0105 \u2014 zawarto\u015B\u0107 jest ju\u017C podana dla materia\u0142u 'jak dostarczonego', bez osobnego odliczania."
  },
  // ─── ZŁĄCZA ───────────────────────────────────────────────────────────────
  {
    id: "connectors_gold",
    name: "Z\u0142\u0105cza z\u0142ocone (szpilki, kraw\u0119dziowe)",
    nameEn: "Gold-plated connectors",
    category: "zlacza",
    unit: "kg",
    weightPerPiece: 6e-3,
    metalContentPerKg: {
      Au: { min: 1, max: 5, typical: 2.5 },
      Ag: { min: 0.5, max: 3, typical: 1.5 },
      Pt: { min: 0, max: 0.01, typical: 5e-3 },
      Pd: { min: 0, max: 0.05, typical: 0.02 }
    },
    notes: "Z\u0142ote kraw\u0119dziaki ISA/PCI, z\u0142ocone szpilki (~6g/szt). metalContentPerKg uwzgl\u0119dnia plastikowe korpusy z\u0142\u0105czy \u2014 dane dla materia\u0142u 'jak dostarczonego'."
  },
  {
    id: "connectors_eltra",
    name: "Z\u0142\u0105cza Eltra / podstawki przeka\u017Anikowe (z\u0142ocone)",
    nameEn: "Eltra / relay socket connectors (gold-plated)",
    category: "zlacza",
    unit: "kg",
    weightPerPiece: 0.02,
    metalContentPerKg: {
      Au: { min: 0.5, max: 2.5, typical: 1.2 },
      Ag: { min: 0.3, max: 2, typical: 1 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 0, max: 0.03, typical: 0.012 }
    },
    notes: "Podstawki przeka\u017Anikowe Eltra i podobne z\u0142\u0105cza przemys\u0142owe ze z\u0142oconymi spr\u0119\u017Cynkami stykowymi (~20g/szt). metalContentPerKg uwzgl\u0119dnia plastikowy korpus i metalowe elementy razem \u2014 typowo 8-11 z\u0142oconych styk\xF3w/szt."
  },
  {
    id: "connectors_mixed",
    name: "Z\u0142\u0105cza mieszane (MIX)",
    nameEn: "Mixed connectors",
    category: "zlacza",
    unit: "kg",
    weightPerPiece: 0.012,
    metalContentPerKg: {
      Au: { min: 0.2, max: 1.5, typical: 0.7 },
      Ag: { min: 0.3, max: 2, typical: 1 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 0, max: 0.02, typical: 0.01 }
    },
    notes: "Mieszane z\u0142\u0105cza z r\xF3\u017Cnych urz\u0105dze\u0144 (~12g/szt). metalContentPerKg obliczone dla materia\u0142u z plastikiem i metalem razem."
  },
  // ─── KONDENSATORY ─────────────────────────────────────────────────────────
  {
    id: "capacitors_tantalum",
    name: "Kondensatory tantalowe (preselekcjonowane)",
    nameEn: "Tantalum capacitors (preselected)",
    category: "kondensator",
    unit: "kg",
    weightPerPiece: 1e-3,
    metalContentPerKg: {
      Au: { min: 0, max: 0.05, typical: 0.01 },
      Ag: { min: 0.5, max: 3, typical: 1.5 },
      Pt: { min: 0, max: 5e-3, typical: 2e-3 },
      Pd: { min: 0.1, max: 1, typical: 0.5 }
    },
    notes: "Kondensatory tantalowe SMD i przewlekane (~1g/szt). metalContentPerKg uwzgl\u0119dnia ca\u0142\u0105 obudow\u0119 kondensatora \u2014 bogate w pallad."
  },
  {
    id: "capacitors_ceramic_mlcc",
    name: "Kondensatory ceramiczne MLCC (preselekcjonowane)",
    nameEn: "MLCC Ceramic capacitors (preselected)",
    category: "kondensator",
    unit: "kg",
    weightPerPiece: 2e-4,
    metalContentPerKg: {
      Au: { min: 0, max: 0.02, typical: 5e-3 },
      Ag: { min: 1, max: 5, typical: 2.5 },
      Pt: { min: 0, max: 0.01, typical: 5e-3 },
      Pd: { min: 0.2, max: 2, typical: 1 }
    },
    notes: "Wielowarstwowe kondensatory ceramiczne MLCC (~0.2g/szt). metalContentPerKg uwzgl\u0119dnia ceramik\u0119, elektrody i pokrywy razem \u2014 znaczna zawarto\u015B\u0107 Ag i Pd."
  },
  // ─── INNE ─────────────────────────────────────────────────────────────────
  {
    id: "catalytic_converter",
    name: "Katalizator samochodowy",
    nameEn: "Automotive catalytic converter",
    category: "inne",
    unit: "kg",
    weightPerPiece: 2,
    metalContentPerKg: {
      Au: { min: 0, max: 0.01, typical: 2e-3 },
      Ag: { min: 0, max: 0.05, typical: 0.01 },
      Pt: { min: 0.5, max: 5, typical: 2.5 },
      Pd: { min: 1, max: 10, typical: 5 }
    },
    notes: "Ceramiczny rdze\u0144 katalizatora samochodowego (~2 kg/szt bez obudowy). Bardzo bogaty w Pt i Pd \u2014 metalContentPerKg dla samego rdzenia ceramicznego."
  },
  {
    id: "ufo_mix",
    name: "UFO \u2014 Nieznane/Mieszane",
    nameEn: "UFO - Unknown/Mixed scrap",
    category: "inne",
    unit: "kg",
    metalContentPerKg: {
      Au: { min: 0.03, max: 0.15, typical: 0.07 },
      Ag: { min: 0.3, max: 1.5, typical: 0.8 },
      Pt: { min: 0, max: 0.01, typical: 3e-3 },
      Pd: { min: 0, max: 0.05, typical: 0.02 }
    },
    notes: "Niezidentyfikowane elementy elektroniczne, z\u0142om mieszany. metalContentPerKg to warto\u015B\u0107 u\u015Bredniona \u2014 rzeczywista zawarto\u015B\u0107 mo\u017Ce si\u0119 znacznie r\xF3\u017Cni\u0107."
  }
];
router3.get("/materials/electronics", (_req, res) => {
  res.json(electronicMaterials);
});
var materials_default = router3;

// src/routes/chemicals.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
var PREP_STEPS_ELECTRONIC = [
  "Demonta\u017C mechaniczny: usu\u0144 \u015Bruby, obudowy plastikowe, z\u0142\u0105cza wtykowe i du\u017Ce kondensatory elektrolityczne (typ. zmniejsza mas\u0119 wsadu o 20-40%)",
  "Separacja materia\u0142\xF3w: odseparuj elementy plastikowe i ceramiczne (selekcja wzrokowa), ferromagnetyki magnesem trwa\u0142ym \u2014 nie reaguj\u0105 z kwasami i utrudniaj\u0105 filtracj\u0119",
  "Rozdrobnienie wsadu: poci\u0105\u0107 p\u0142ytki na kawa\u0142ki < 2 cm no\u017Cycami do blachy lub granulatorem \u2014 krytyczne dla szybko\u015Bci i kompletno\u015Bci reakcji kwasowej"
];
var PREP_STEPS_METAL = [
  "Weryfikacja wsadu: sprawd\u017A sk\u0142ad stopu (wymagane min. 90% Au) \u2014 u\u017Cyj kamienia probierczego, spektrometru XRF lub analizy chemicznej",
  "Wytop wst\u0119pny: je\u015Bli wsad jest proszkiem lub z\u0142omem, przetop w tyglu grafitowym z boraksem i odlej na wst\u0119pne ingoty/anody",
  "Przygotowanie instalacji: sprawd\u017A wyposa\u017Cenie elektryczne/gazowe, skalibruj mierniki, przygotuj komplet odczynnik\xF3w i naczynie robocze"
];
var PREP_STEPS_SOLUTION = [
  "Weryfikacja roztworu: sprawd\u017A zawarto\u015B\u0107 Au/Ag w roztworze wej\u015Bciowym (np. po \u0142ugowaniu cyjankowym lub filtracie HNO3)",
  "Regulacja pH: doprowad\u017A pH do 10-12 dodaj\u0105c Ca(OH)2 lub NaOH \u2014 KRYTYCZNE przy NaCN (poni\u017Cej pH 10 powstaje \u015Bmiertelny HCN!)",
  "Przygotowanie granulat Zn: op\u0142ucz granulki rozcie\u0144czonym kwasem (usuwa tlenki), przemyj wod\u0105 destylowan\u0105, przygotuj pojemnik filtracyjny"
];
var chemicalProcesses = [
  {
    id: "aqua_regia",
    name: "Woda Kr\xF3lewska (HCl + HNO3)",
    nameEn: "Aqua Regia",
    description: "Klasyczna metoda odzysku z\u0142ota i platynowc\xF3w. WA\u017BNE: Przed wod\u0105 kr\xF3lewsk\u0105 wsad nale\u017Cy najpierw przetrawi\u0107 w rozcie\u0144czonym HNO3 (25%), aby usun\u0105\u0107 mied\u017A, nikiel i inne metale nieszlachetne \u2014 dopiero oczyszczony osad poddaje si\u0119 wodzie kr\xF3lewskiej. Mieszanina HCl:HNO3 (3:1 obj.) rozpuszcza Au, Pt, Pd. Srebro wytr\u0105ca si\u0119 jako AgCl ju\u017C w trakcie trawienia.",
    targetMetals: ["Au", "Pt", "Pd"],
    outputPurityText: "Au: 95\u201399% (surowy proszek) \u2192 wymaga rafinacji elektrolitycznej do 999; Pt/Pd: 40\u201360% surowego str\u0105tu \u2014 wymagana dalsza separacja",
    reagents: [
      {
        name: "Kwas azotowy rozcie\u0144czony \u2014 pre-trawienie (HNO3 25%)",
        formula: "HNO3",
        concentration: 25,
        availableConcentrations: [20, 25, 30, 35, 45, 50],
        amountPerKg: 0.5,
        pricePerLiter: 22
      },
      {
        name: "Kwas solny (HCl)",
        formula: "HCl",
        concentration: 35,
        availableConcentrations: [25, 30, 33, 35, 37],
        amountPerKg: 0.4,
        pricePerLiter: 18
      },
      {
        name: "Kwas azotowy st\u0119\u017Cony (HNO3 65%)",
        formula: "HNO3",
        concentration: 65,
        availableConcentrations: [50, 55, 60, 65, 68],
        amountPerKg: 0.15,
        pricePerLiter: 28
      },
      {
        name: "Mocznik (rozk\u0142ad nadmiaru HNO3)",
        formula: "CO(NH2)2",
        concentration: 99,
        amountPerKg: 0.03,
        pricePerLiter: 4
      },
      {
        name: "Wodorosiarczyn sodu \u2014 reduktor SMB (wytr\u0105canie Au)",
        formula: "NaHSO3",
        concentration: 40,
        availableConcentrations: [35, 40, 45],
        amountPerKg: 0.02,
        pricePerLiter: 12
      },
      {
        name: "Boraks (topnik do wytopu)",
        formula: "Na2B4O7",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 10
      }
    ],
    temperatureMin: 50,
    temperatureMax: 90,
    temperatureOptimal: 70,
    timePerKgMin: 4,
    timePerKgMax: 10,
    yieldPercent: { Au: 95, Ag: 20, Pt: 85, Pd: 80 },
    electricityKwhPerKg: 0.6,
    safetyNotes: "UWAGA: Wydziela truj\u0105ce opary NOx i HCl. Praca WY\u0141\u0104CZNIE pod sprawnym wyci\u0105giem z aktywnym w\u0119glem. Wyposa\u017Cenie: maska z filtrem ABEK P3, r\u0119kawice kwasoodporne (nitril/neopren), fartuch kwasoodporny, gogle ochronne. Nigdy nie wlewaj wody do st\u0119\u017Conego kwasu!",
    steps: [
      ...PREP_STEPS_ELECTRONIC,
      "BHP: sprawd\u017A wyci\u0105g, za\u0142\xF3\u017C mask\u0119 ABEK P3, r\u0119kawice kwasoodporne i gogle przed rozpocz\u0119ciem",
      "Pre-trawienie HNO3: rozdrobniony wsad zalej HNO3 25% (~500 ml/kg), podgrzej do 40\xB0C przez 2-3h \u2014 usuwa Cu, Ni, Pb, Fe, Sn",
      "Ods\u0105cz i przemyj osad (Au, Pt, Pd, AgCl, ceramika) wod\u0105 destylowan\u0105 \u2014 filtrat z HNO3 zachowaj do odzysku Ag i Cu",
      "Woda kr\xF3lewska: przygotuj mieszanin\u0119 HCl 35% + HNO3 65% w proporcji 3:1 (obj.) w naczyniu PTFE lub szkle borokrzemowym",
      "Powoli wsypuj osad do wody kr\xF3lewskiej, podgrzewaj do 60-70\xB0C mieszaj\u0105c co 30 min \u2014 Au, Pt, Pd przechodz\u0105 do roztworu",
      "Po rozpuszczeniu (4-8h) ods\u0105cz ceramik\u0119 i AgCl \u2014 AgCl od\u0142\xF3\u017C do dalszego odzysku srebra",
      "Rozk\u0142ad HNO3: dodaj mocznik CO(NH2)2 porcjami (1-2 g/100 ml) a\u017C ust\u0105pi\u0105 b\u0105belki \u2014 niszczy nadmiar HNO3 przeszkadzaj\u0105cy redukcji",
      "Wytr\u0105canie Au: powoli dodawaj SMB (NaHSO3) do zimnego roztworu \u2014 z\u0142oto wytr\u0105ca si\u0119 jako br\u0105zowy proszek",
      "Ods\u0105cz z\u0142oty proszek, przemyj 3\xD7 wod\u0105 destylowan\u0105, przemyj acetonem, wysusz",
      "Wytop: umie\u015B\u0107 proszek w tyglu grafitowym, dodaj szczypt\u0119 boraksu jako topnik, przetop palnikiem lub piecem (>1064\xB0C)",
      "Platyn\u0119 i pallad wytr\u0105\u0107 z filtratu \u2014 Pt przez NH4Cl (wytr\u0105ca (NH4)2PtCl6), Pd przez DMAG lub cementacj\u0119 Cu"
    ]
  },
  {
    id: "hno3_dilute",
    name: "Kwas azotowy rozcie\u0144czony (HNO3 25-30%)",
    nameEn: "Dilute Nitric Acid",
    description: "Selektywna metoda odzysku srebra i metali pospolitych (Cu, Ni, Pb). Z\u0142oto nie reaguje z rozcie\u0144czonym HNO3 i pozostaje w osadzie jako cenny produkt do dalszej obr\xF3bki wod\u0105 kr\xF3lewsk\u0105.",
    targetMetals: ["Ag"],
    outputPurityText: "Ag: 90\u201395% (po redukcji Zn) \u2014 odpowiada pr\xF3bie 900\u2013950; osad (Au, Pt) do dalszej obr\xF3bki wod\u0105 kr\xF3lewsk\u0105",
    reagents: [
      {
        name: "Kwas azotowy rozcie\u0144czony (HNO3 25%)",
        formula: "HNO3",
        concentration: 25,
        availableConcentrations: [20, 25, 30, 35, 45, 50],
        amountPerKg: 0.5,
        pricePerLiter: 22
      },
      {
        name: "Chlorek sodu (wytr\u0105canie AgCl)",
        formula: "NaCl",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3
      },
      {
        name: "Cynk metaliczny \u2014 redukcja AgCl\u2192Ag",
        formula: "Zn",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 65
      },
      {
        name: "Kwas solny HCl \u2014 rozpuszczenie cynku z osadu",
        formula: "HCl",
        concentration: 35,
        availableConcentrations: [25, 30, 33, 35, 37],
        amountPerKg: 0.05,
        pricePerLiter: 18
      }
    ],
    temperatureMin: 20,
    temperatureMax: 60,
    temperatureOptimal: 40,
    timePerKgMin: 2,
    timePerKgMax: 6,
    yieldPercent: { Au: 0, Ag: 85, Pt: 5, Pd: 10 },
    electricityKwhPerKg: 0.2,
    safetyNotes: "Wydziela opary NO2/NO (brunatne/bezbarwne). Praca pod wyci\u0105giem. R\u0119kawice kwasoodporne obowi\u0105zkowe. Uwaga przy etapie HCl \u2014 wydziela gaz H2 przy kontakcie z cynkiem (brak iskier!).",
    steps: [
      ...PREP_STEPS_ELECTRONIC,
      "BHP: wyci\u0105g, r\u0119kawice kwasoodporne, gogle ochronne",
      "Przygotuj HNO3 25% w naczyniu kwasoodpornym",
      "Dodaj wsad elektroniczny porcjami \u2014 obserwuj intensywno\u015B\u0107 reakcji (opary NO2)",
      "Mieszaj i podgrzewaj do 40\xB0C przez 2-4h \u2014 Cu, Ag, Ni, Pb przechodz\u0105 do roztworu",
      "Ods\u0105cz osad (Au, Pt, ceramika) \u2014 cenny wsad do dalszego procesu wody kr\xF3lewskiej",
      "Wytr\u0105canie Ag: do filtratu dodaj NaCl \u2014 wytr\u0105ca si\u0119 AgCl (bia\u0142y osad)",
      "Ods\u0105cz AgCl, przemyj 3\xD7 wod\u0105 destylowan\u0105, osusz",
      "Redukcja AgCl\u2192Ag: umie\u015B\u0107 AgCl w naczyniu, dodaj granulki Zn i przykryj wod\u0105 \u2014 Zn wypiera Ag z AgCl",
      "Poczekaj 30-60 min \u2014 ods\u0105cz szary proszek Ag + resztki Zn",
      "Dodaj rozcie\u0144czony HCl \u2014 dissolwuje Zn, Ag pozostaje; ods\u0105cz, przemyj, wysusz proszek Ag",
      "Przetop proszek Ag w tyglu \u2014 gotowe metaliczne srebro"
    ]
  },
  {
    id: "hno3_concentrated",
    name: "Kwas azotowy st\u0119\u017Cony (HNO3 65%)",
    nameEn: "Concentrated Nitric Acid",
    description: "Agresywna metoda do wsad\xF3w bogatych w mied\u017A i srebro. St\u0119\u017Cony HNO3 szybko rozpuszcza metale nieszlachetne, Ag i Pd, pozostawiaj\u0105c Au i Pt w osadzie. Wymaga NaCl do wytr\u0105cenia AgCl i cynku do redukcji srebra metalicznego.",
    targetMetals: ["Ag", "Pd"],
    outputPurityText: "Ag: 92\u201397% (po redukcji Zn) \u2014 odpowiada pr\xF3bie 920\u2013970; Pd: 70\u201385% surowy (wymaga dalszego oczyszczenia)",
    reagents: [
      {
        name: "Kwas azotowy st\u0119\u017Cony (HNO3 65%)",
        formula: "HNO3",
        concentration: 65,
        availableConcentrations: [50, 55, 60, 65, 68],
        amountPerKg: 0.4,
        pricePerLiter: 28
      },
      {
        name: "Chlorek sodu (wytr\u0105canie AgCl)",
        formula: "NaCl",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3
      },
      {
        name: "Cynk metaliczny \u2014 redukcja AgCl\u2192Ag",
        formula: "Zn",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 65
      },
      {
        name: "Kwas solny HCl \u2014 rozpuszczenie cynku z osadu",
        formula: "HCl",
        concentration: 35,
        availableConcentrations: [25, 30, 33, 35, 37],
        amountPerKg: 0.05,
        pricePerLiter: 18
      }
    ],
    temperatureMin: 20,
    temperatureMax: 50,
    temperatureOptimal: 35,
    timePerKgMin: 1,
    timePerKgMax: 4,
    yieldPercent: { Au: 0, Ag: 90, Pt: 0, Pd: 70 },
    electricityKwhPerKg: 0.15,
    safetyNotes: "BARDZO NIEBEZPIECZNY. Intensywne opary NOx (brunatny dym). Wymagany sprawny wyci\u0105g z aktywnym w\u0119glem. Maska ABEK P3, r\u0119kawice kwasoodporne, gogle. Reakcja gwa\u0142towna \u2014 dodawaj wsad bardzo powoli i ma\u0142ymi porcjami!",
    steps: [
      ...PREP_STEPS_ELECTRONIC,
      "BHP: wyci\u0105g aktywny z w\u0119glem, maska ABEK P3, r\u0119kawice kwasoodporne, gogle",
      "Wlej st\u0119\u017Cony HNO3 65% do naczynia kwasoodpornego (PTFE lub szk\u0142o borokrzemowe)",
      "Wsad dodawaj BARDZO powoli porcjami \u2014 reakcja jest gwa\u0142towna, intensywne brunatne opary NOx",
      "Utrzymuj temperatur\u0119 30-40\xB0C (reakcja egzotermiczna \u2014 ch\u0142od\u017A w razie potrzeby)",
      "Kontynuuj do zaniku intensywnych opar\xF3w (1-3h na kg wsadu)",
      "Ods\u0105cz osad (Au, Pt, ceramika) \u2014 zachowaj do dalszej obr\xF3bki wod\u0105 kr\xF3lewsk\u0105",
      "Wytr\u0105canie Ag: do filtratu dodaj NaCl \u2014 wytr\u0105ca si\u0119 AgCl (bia\u0142y osad)",
      "Ods\u0105cz AgCl, przemyj 3\xD7 wod\u0105 destylowan\u0105, osusz",
      "Redukcja AgCl\u2192Ag: dodaj granulki Zn do zawiesiny AgCl z wod\u0105 \u2014 Zn wypiera Ag",
      "Po 30-60 min ods\u0105cz szary proszek Ag+Zn; dodaj HCl \u2014 dissolwuje Zn, Ag pozostaje",
      "Ods\u0105cz i przemyj proszek Ag, przetop w tyglu \u2014 gotowe metaliczne srebro"
    ]
  },
  {
    id: "hcl_h2o2",
    name: "HCl + H2O2 (etching kwasowy)",
    nameEn: "HCl + H2O2 Acid Etching",
    description: "Alternatywna metoda dla wody kr\xF3lewskiej. Kwas solny z nadtlenkiem wodoru tworzy chlor in-situ, kt\xF3ry rozpuszcza z\u0142oto. Bezpieczniejsza alternatywa \u2014 bez opar\xF3w NOx. Na koniec z\u0142oty proszek przetapiany z boraksem.",
    targetMetals: ["Au", "Pd"],
    outputPurityText: "Au: 95\u201398% (surowy proszek po SMB) \u2014 odpowiada pr\xF3bie 950\u2013980; wymaga rafinacji elektrolitycznej do 999; Pd: 50\u201370% surowy",
    reagents: [
      {
        name: "Kwas solny (HCl)",
        formula: "HCl",
        concentration: 35,
        availableConcentrations: [25, 30, 33, 35, 37],
        amountPerKg: 0.5,
        pricePerLiter: 18
      },
      {
        name: "Nadtlenek wodoru (H2O2)",
        formula: "H2O2",
        concentration: 30,
        availableConcentrations: [3, 15, 30, 35],
        amountPerKg: 0.2,
        pricePerLiter: 20
      },
      {
        name: "Wodorosiarczyn sodu \u2014 reduktor SMB (wytr\u0105canie Au)",
        formula: "NaHSO3",
        concentration: 40,
        availableConcentrations: [35, 40, 45],
        amountPerKg: 0.02,
        pricePerLiter: 12
      },
      {
        name: "Boraks (topnik do wytopu Au)",
        formula: "Na2B4O7",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 10
      }
    ],
    temperatureMin: 20,
    temperatureMax: 60,
    temperatureOptimal: 45,
    timePerKgMin: 6,
    timePerKgMax: 16,
    yieldPercent: { Au: 90, Ag: 15, Pt: 60, Pd: 75 },
    electricityKwhPerKg: 0.3,
    safetyNotes: "Brak opar\xF3w NOx, ale wydziela chlor gazowy (\u017C\xF3\u0142tozielony). Praca pod wyci\u0105giem. R\u0119kawice kwasoodporne, gogle. H2O2 dodawaj bardzo ostro\u017Cnie \u2014 reakcja egzotermiczna; nigdy nie dodawaj du\u017Cej porcji naraz.",
    steps: [
      ...PREP_STEPS_ELECTRONIC,
      "BHP: wyci\u0105g (chlor!), r\u0119kawice kwasoodporne, gogle ochronne",
      "Wlej HCl 35% do naczynia kwasoodpornego (PTFE lub szk\u0142o)",
      "Dodaj rozdrobniony wsad elektroniczny",
      "Bardzo powoli, porcjami po 10-20 ml, dodawaj H2O2 30% \u2014 pojawi si\u0119 chlor, reakcja jest egzotermiczna",
      "Mieszaj regularnie, utrzymuj temp. 40-50\xB0C; dodawaj H2O2, gdy reakcja zwalnia",
      "Po 12-24h filtruj \u2014 ceramika i nierozpuszczony osad zostaj\u0105 na filtrze",
      "Wytr\u0105canie Au: och\u0142od\u017A roztw\xF3r; powoli dodawaj SMB (NaHSO3) \u2014 br\u0105zowy proszek Au wytr\u0105ca si\u0119",
      "Ods\u0105cz z\u0142oto, przemyj 3\xD7 wod\u0105 destylowan\u0105, przemyj acetonem, wysusz",
      "Wytop proszek Au w tyglu grafitowym ze szczypt\u0105 boraksu jako topnikiem (>1064\xB0C)"
    ]
  },
  {
    id: "nitrate_boat",
    name: "\u0141\xF3d\u017A azotanowa (NaNO3 + H2SO4)",
    nameEn: "Nitrate Boat (NaNO3 + H2SO4)",
    description: "Stara metoda rafinacyjna stosowana przez jubiler\xF3w. Mieszanina azotanu sodu i kwasu siarkowego tworzy kwas azotowy in-situ. Skuteczna do oczyszczania stop\xF3w z\u0142ota. Wymaga NaCl do wytr\u0105cenia Ag i SMB do wytr\u0105cenia Au z roztworu.",
    targetMetals: ["Au", "Ag"],
    outputPurityText: "Au: 85\u201392% surowy (wymaga dalszej rafinacji elektrolitycznej); Ag: 90\u201395% (surowy AgCl po wytr\u0105ceniu NaCl)",
    reagents: [
      {
        name: "Azotan sodu (NaNO3)",
        formula: "NaNO3",
        concentration: 99,
        amountPerKg: 0.15,
        pricePerLiter: 18
      },
      {
        name: "Kwas siarkowy (H2SO4)",
        formula: "H2SO4",
        concentration: 98,
        availableConcentrations: [50, 70, 80, 96, 98],
        amountPerKg: 0.5,
        pricePerLiter: 28
      },
      {
        name: "Chlorek sodu (wytr\u0105canie AgCl)",
        formula: "NaCl",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3
      },
      {
        name: "Wodorosiarczyn sodu \u2014 SMB (wytr\u0105canie Au)",
        formula: "NaHSO3",
        concentration: 40,
        availableConcentrations: [35, 40, 45],
        amountPerKg: 0.05,
        pricePerLiter: 12
      }
    ],
    temperatureMin: 60,
    temperatureMax: 120,
    temperatureOptimal: 90,
    timePerKgMin: 3,
    timePerKgMax: 8,
    yieldPercent: { Au: 85, Ag: 90, Pt: 30, Pd: 40 },
    electricityKwhPerKg: 0.8,
    safetyNotes: "BARDZO WYSOKA TEMPERATURA + opary NOx. H2SO4 98% jest silnie egzotermiczny z wod\u0105 \u2014 nigdy nie dodawaj wody do st\u0119\u017Conego H2SO4! Maska ABEK P3, r\u0119kawice kwasoodporne termooodporne (neopren), fartuch, gogle. Wyci\u0105g obowi\u0105zkowy.",
    steps: [
      ...PREP_STEPS_ELECTRONIC,
      "BHP: wyci\u0105g z aktywnym w\u0119glem, maska ABEK P3, r\u0119kawice termooodporne i kwasoodporne, gogle",
      "Wlej H2SO4 98% do naczynia \u017Caroodpornego i kwasoodpornego (kwarc lub niobian)",
      "Stopniowo dodawaj NaNO3 do kwasu \u2014 NIE odwrotnie! Mieszaj do rozpuszczenia",
      "Podgrzewaj do 80-100\xB0C przy ci\u0105g\u0142ym mieszaniu \u2014 tworzy si\u0119 HNO3 in-situ",
      "Dodaj rozdrobniony wsad elektroniczny porcjami",
      "Utrzymuj temperatur\u0119 80-100\xB0C przez 3-6h \u2014 metale przechodz\u0105 do roztworu",
      "Ostud\u017A do pokojowej; ostro\u017Cnie rozcie\u0144cz wod\u0105 (SILNIE EGZOTERMICZNE \u2014 dodawaj wod\u0119 DO kwasu, nie odwrotnie!)",
      "Wytr\u0105canie Ag: do filtratu dodaj NaCl \u2014 bia\u0142y osad AgCl; ods\u0105cz, przemyj, osusz",
      "Wytr\u0105canie Au: do filtratu bez AgCl dodaj SMB (NaHSO3) \u2014 br\u0105zowy proszek Au wytr\u0105ca si\u0119",
      "Ods\u0105cz z\u0142oto, przemyj, wysusz i przetop w tyglu grafitowym"
    ]
  },
  {
    id: "electrolysis",
    name: "Elektroliza (rafinacja elektrolityczna)",
    nameEn: "Electrolytic Refining",
    description: "Selektywna metoda rafinacji z\u0142ota. Z\u0142oto z anody przechodzi do katody jako czysty metal 999+. Wymaga wst\u0119pnego stopienia wsadu w anod\u0119 (z boraksem jako topnikiem). Elektrolit: HNO3 10% + Au(NO3)3.",
    targetMetals: ["Au", "Ag"],
    outputPurityText: "Au: 999+ (99.9%) \u2014 gotowe do sprzeda\u017Cy jako z\u0142oto inwestycyjne; Ag: 95\u201398% (szlam anodowy wymaga dalszej obr\xF3bki)",
    reagents: [
      {
        name: "Kwas azotowy (elektrolit bazowy)",
        formula: "HNO3",
        concentration: 10,
        availableConcentrations: [5, 8, 10, 12, 15, 20],
        amountPerKg: 0.5,
        pricePerLiter: 18
      },
      {
        name: "Azotan z\u0142ota (Au(NO3)3, uzupe\u0142niacz elektrolitu)",
        formula: "Au(NO3)3",
        concentration: 5,
        amountPerKg: 0.025,
        pricePerLiter: 1800
      },
      {
        name: "Boraks (topnik do wytopu anody)",
        formula: "Na2B4O7",
        concentration: 99,
        amountPerKg: 0.05,
        pricePerLiter: 10
      }
    ],
    temperatureMin: 20,
    temperatureMax: 50,
    temperatureOptimal: 30,
    timePerKgMin: 8,
    timePerKgMax: 24,
    yieldPercent: { Au: 99, Ag: 95, Pt: 60, Pd: 50 },
    electricityKwhPerKg: 2.5,
    safetyNotes: "Elektroliza sama w sobie jest stosunkowo bezpieczna. Jednak elektrolit (HNO3 10%) jest \u017Cr\u0105cy \u2014 r\u0119kawice nitrylowe i gogle. Etap wytopu anody wymaga palnika (>1064\xB0C) \u2014 \u015Brodki ochrony p.po\u017C.",
    steps: [
      ...PREP_STEPS_METAL,
      "BHP: r\u0119kawice nitrylowe, gogle; przy wytociu anody \u2014 os\u0142ona termiczna i r\u0119kawice \u017Caroodporne",
      "Wytop anody: przetop wsad w tyglu grafitowym z boraksem jako topnikiem \u2014 uformuj anod\u0119 (blok lub p\u0142ytka)",
      "Przygotuj elektrolit: HNO3 10% + Au(NO3)3 w wannie elektrolitycznej, podgrzej do 25-30\xB0C",
      "Zamontuj anod\u0119 (wsad) i katod\u0119 (folia tytanowa lub czyste Au)",
      "Ustaw napi\u0119cie 0.5-1.5V, g\u0119sto\u015B\u0107 pr\u0105du 50-200 A/m\xB2",
      "Elektrolizuj 12-48h \u2014 z\u0142oto osadza si\u0119 na katodzie jako czysty metal 999+",
      "Regularnie zbieraj szlam anodowy (Pt, Pd, Ag, inne) do dalszej obr\xF3bki",
      "Wyjmij katod\u0119, oczy\u015B\u0107 z elektrolitu, przemyj wod\u0105 destylowan\u0105, przetop",
      "Wynik: z\u0142oto 999+ czysto\u015Bci; szlam anodowy przetworzy\u0107 wod\u0105 kr\xF3lewsk\u0105 lub procesem W\xF6hlwilla"
    ]
  },
  {
    id: "wohlwill_process",
    name: "Proces W\xF6hlwilla (rafinacja z\u0142ota 999.9)",
    nameEn: "Wohlwill Process",
    description: "Przemys\u0142owy proces elektrolityczny dla z\u0142ota najwy\u017Cszej czysto\u015Bci (999.9). Elektrolit na bazie chlorku z\u0142ota (AuCl3) w HCl. Standard dla mennic i rafinerii. Wymaga wst\u0119pnego wytopu anod z boraksem jako topnikiem.",
    targetMetals: ["Au"],
    outputPurityText: "Au: 999.9 (99.99%) \u2014 najwy\u017Csza mo\u017Cliwa czysto\u015B\u0107 komercyjna; standard mennic i rynku inwestycyjnego (z\u0142oto lokacyjne)",
    reagents: [
      {
        name: "Kwas solny (elektrolit bazowy HCl 20%)",
        formula: "HCl",
        concentration: 20,
        availableConcentrations: [15, 20, 25, 30],
        amountPerKg: 1,
        pricePerLiter: 12
      },
      {
        name: "Chlorek z\u0142ota (AuCl3, uzupe\u0142niacz elektrolitu)",
        formula: "AuCl3",
        concentration: 10,
        amountPerKg: 0.05,
        pricePerLiter: 3200
      },
      {
        name: "Boraks (topnik do wytopu anod)",
        formula: "Na2B4O7",
        concentration: 99,
        amountPerKg: 0.02,
        pricePerLiter: 10
      }
    ],
    temperatureMin: 60,
    temperatureMax: 75,
    temperatureOptimal: 70,
    timePerKgMin: 24,
    timePerKgMax: 48,
    yieldPercent: { Au: 99.5, Ag: 0, Pt: 30, Pd: 20 },
    electricityKwhPerKg: 3,
    safetyNotes: "Wysoka temperatura elektrolitu (65-70\xB0C). Opary HCl \u2014 wyci\u0105g obowi\u0105zkowy. R\u0119kawice kwasoodporne, gogle. Etap wytopu anod wymaga palnika (>1064\xB0C) \u2014 os\u0142ona termiczna. Koszt AuCl3 bardzo wysoki \u2014 op\u0142acalny tylko dla wsad\xF3w z >90% Au.",
    steps: [
      ...PREP_STEPS_METAL,
      "BHP: wyci\u0105g aktywny (opary HCl), r\u0119kawice kwasoodporne, gogle; przy wytocie anod \u2014 os\u0142ona termiczna",
      "Wytop anod: przetop wsad (min. 90% Au) w tyglu grafitowym z boraksem \u2014 uformuj anody (p\u0142ytki ~5-10mm)",
      "Przygotuj elektrolit: HCl 20% + AuCl3 10% w wannie kwasoodpornej, podgrzej do 65-70\xB0C",
      "Zamontuj anody i katody (folia tytanowa lub czyste Au)",
      "Ustaw parametry: U=1.0-1.2V, g\u0119sto\u015B\u0107 pr\u0105du 500-1000 A/m\xB2, T=65-70\xB0C",
      "Elektrolizuj 24-72h \u2014 z\u0142oto 999.9 osadza si\u0119 na katodach jako kryszta\u0142y",
      "Pobierz katody, oczy\u015B\u0107 z elektrolitu wod\u0105 destylowan\u0105, osusz",
      "Przetop katody w tyglu grafitowym \u2014 gotowe z\u0142oto 999.9",
      "Szlam anodowy (Pt, Pd, Ag) przetworzy\u0107 oddzielnie (kwas azotowy lub woda kr\xF3lewska)"
    ]
  },
  {
    id: "miller_process",
    name: "Proces Millera (chloracja pirometalurgiczna)",
    nameEn: "Miller Process (Chlorination)",
    category: "pyrometallurgical",
    description: "Przemys\u0142owa metoda oczyszczania z\u0142ota przez nadmuch chloru do stopionego metalu w piecu indukcyjnym. Zanieczyszczenia (Ag, Cu, Pb, Zn) reaguj\u0105 z Cl2, tworz\u0105c chlorki kt\xF3re p\u0142ywaj\u0105 na powierzchni. Z\u0142oto pozostaje czyste (99.0-99.5%). WYMAGA instalacji neutralizacji Cl2 (NaOH).",
    targetMetals: ["Au"],
    outputPurityText: "Au: 990\u2013995 (99.0\u201399.5%) \u2014 produkt po\u015Bredni; wymaga rafinacji W\xF6hlwilla do 999.9 dla rynku inwestycyjnego",
    reagents: [
      {
        name: "Chlor gazowy (Cl2)",
        formula: "Cl2",
        concentration: 99,
        amountPerKg: 0.15,
        pricePerLiter: 38
      },
      {
        name: "Boraks (topnik)",
        formula: "Na2B4O7",
        concentration: 99,
        amountPerKg: 0.1,
        pricePerLiter: 10
      },
      {
        name: "Wodorotlenek sodu NaOH 30% (neutralizacja Cl2 w off-gazie)",
        formula: "NaOH",
        concentration: 30,
        availableConcentrations: [10, 20, 25, 30, 40, 50],
        amountPerKg: 0.3,
        pricePerLiter: 8
      }
    ],
    temperatureMin: 1064,
    temperatureMax: 1200,
    temperatureOptimal: 1100,
    timePerKgMin: 0.5,
    timePerKgMax: 2,
    yieldPercent: { Au: 98, Ag: 0, Pt: 20, Pd: 10 },
    electricityKwhPerKg: 5,
    safetyNotes: "EKSTREMALNIE NIEBEZPIECZNY \u2014 chlor gazowy jest silnie toksyczny (LC50=430 mg/m\xB3). WYMAGANY szczelny system z pe\u0142n\u0105 instalacj\u0105 scrubberow\u0105 NaOH. Tylko dla profesjonalnych rafinerii z certyfikowanym wyposa\u017Ceniem, systemem wentylacji i szkolonym personelem. NIE dla amator\xF3w.",
    steps: [
      ...PREP_STEPS_METAL,
      "BHP: certyfikowany scrubber Cl2 z NaOH, maska z filtrem B2P3 lub aparat powietrzny, kombinezon kwasoodporny, wyci\u0105g przemys\u0142owy \u2014 MINIMUM",
      "Uruchom piec indukcyjny, nagrzej tygiel grafitowy do 1100\xB0C",
      "Dodaj wsad (stop z\u0142ota) i boraks jako topnik \u2014 poczekaj do pe\u0142nego stopienia",
      "Pod\u0142\u0105cz instalacj\u0119 Cl2 (rura kwarc/glinka) \u2014 sprawd\u017A szczelno\u015B\u0107 systemu scrubberowego NaOH",
      "Wdmuchuj Cl2 powoli do stopionego metalu \u2014 obserwuj kolor p\u0142omienia (\u017C\xF3\u0142ty = AgCl, bia\u0142y = PbCl2/ZnCl2)",
      "Off-gaz Cl2 przechodzi przez scrubber NaOH \u2014 sprawdzaj poch\u0142anianie papierkiem lakmusowym",
      "Kontynuuj do zaniku barwnych p\u0142omieni i klarowania stopionego z\u0142ota (0.5-2h)",
      "Zatrzymaj dop\u0142yw Cl2, spu\u015B\u0107 z\u0142ocisty metal do form \u2014 wynik: Au 99.0-99.5%",
      "Chlorki z powierzchni (szlam) przetworzy\u0107 do odzysku Ag \u2014 zawieraj\u0105 AgCl"
    ]
  },
  {
    id: "cementation_zinc",
    name: "Cementacja cynkiem (wytr\u0105canie Au)",
    nameEn: "Zinc Cementation",
    description: "Klasyczna metoda wytr\u0105cania z\u0142ota z roztworu (np. cyjanku lub chlorku) przez dodanie cynku. Cynk wypiera z\u0142oto z roztworu \u2014 cementacja. Po cementacji cynk rozpuszcza si\u0119 w HCl, a z\u0142oto pozostaje jako proszek.",
    targetMetals: ["Au", "Ag"],
    outputPurityText: "Au/Ag: 80\u201390% (surowy stop Au+Ag po wytopu) \u2014 wymaga dalszej rafinacji elektrolitycznej lub procesem Millera",
    reagents: [
      {
        name: "Cynk metaliczny (granulki Zn)",
        formula: "Zn",
        concentration: 99,
        amountPerKg: 0.1,
        pricePerLiter: 65
      },
      {
        name: "\u0141ug cyjanku sodu (NaCN, opcjonalny \u2014 do \u0142ugowania)",
        formula: "NaCN",
        concentration: 5,
        availableConcentrations: [2, 5, 8, 10, 15, 20],
        amountPerKg: 0.3,
        pricePerLiter: 40
      },
      {
        name: "Kwas solny HCl (rozpuszczenie cynku z osadu Au+Zn)",
        formula: "HCl",
        concentration: 35,
        availableConcentrations: [25, 30, 33, 35, 37],
        amountPerKg: 0.1,
        pricePerLiter: 18
      }
    ],
    temperatureMin: 20,
    temperatureMax: 60,
    temperatureOptimal: 40,
    timePerKgMin: 3,
    timePerKgMax: 6,
    yieldPercent: { Au: 80, Ag: 75, Pt: 20, Pd: 30 },
    electricityKwhPerKg: 0.1,
    safetyNotes: "KRYTYCZNE przy NaCN \u2014 cyjanki s\u0105 silnie toksyczne (\u015Bmiertelne)! Pracuj ZAWSZE przy pH > 10 (zasadowe). Nigdy nie mieszaj NaCN z kwasem (wydzielanie HCN!). Etap HCl do cynku jest bezpieczny, ale wydziela H2 \u2014 iskry niedopuszczalne.",
    steps: [
      ...PREP_STEPS_SOLUTION,
      "BHP: przy NaCN \u2014 maska z filtrem B2P3, r\u0119kawice nitrylowe, wyci\u0105g; antidotum (Na2S2O3) i apteczka pod r\u0119k\u0105",
      "Dodaj granulki cynku (Zn) do alkalicznego roztworu Au \u2014 Au i Ag osadzaj\u0105 si\u0119 na cynku (cementacja)",
      "Mieszaj przez 2-4h \u2014 z\u0142oto osadza si\u0119 na cynku jako szary/br\u0105zowy osad",
      "Ods\u0105cz osad (Au + Ag + resztki Zn), przemyj wod\u0105",
      "Usuni\u0119cie cynku: przenie\u015B osad do naczynia, dodaj rozcie\u0144czony HCl 35% \u2014 Zn dissolwuje si\u0119, wydziela H2 (brak iskier!); Au i Ag pozostaj\u0105",
      "Ods\u0105cz z\u0142oty/srebrny proszek, przemyj 3\xD7 wod\u0105 destylowan\u0105, wysusz",
      "Przetop proszek w tyglu grafitowym z boraksem \u2014 gotowy stop Au/Ag"
    ]
  }
];
router4.get("/chemicals/processes", (_req, res) => {
  res.json(chemicalProcesses);
});
var chemicals_default = router4;

// src/routes/calculator.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
var electronicMaterialsMap = Object.fromEntries(
  electronicMaterials.map((m) => [
    m.id,
    {
      unit: m.unit,
      weightPerPiece: m.weightPerPiece,
      metalContentPerKg: {
        Au: { typical: m.metalContentPerKg.Au.typical },
        Ag: { typical: m.metalContentPerKg.Ag.typical },
        Pt: { typical: m.metalContentPerKg.Pt.typical },
        Pd: { typical: m.metalContentPerKg.Pd.typical }
      }
    }
  ])
);
var chemicalProcessesMap = {
  aqua_regia: {
    name: "Woda Kr\xF3lewska (HCl + HNO3)",
    reagents: [
      {
        name: "Kwas azotowy rozcie\u0144czony \u2014 pre-trawienie (HNO3 25%)",
        concentration: 25,
        amountPerKg: 0.5,
        pricePerLiter: 22
      },
      {
        name: "Kwas solny (HCl)",
        concentration: 35,
        amountPerKg: 0.4,
        pricePerLiter: 18
      },
      {
        name: "Kwas azotowy st\u0119\u017Cony (HNO3 65%)",
        concentration: 65,
        amountPerKg: 0.15,
        pricePerLiter: 28
      },
      {
        name: "Mocznik (rozk\u0142ad nadmiaru HNO3)",
        concentration: 99,
        amountPerKg: 0.03,
        pricePerLiter: 4
      },
      {
        name: "Wodorosiarczyn sodu \u2014 reduktor SMB (wytr\u0105canie Au)",
        concentration: 40,
        amountPerKg: 0.02,
        pricePerLiter: 12
      },
      {
        name: "Boraks (topnik do wytopu)",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 10
      }
    ],
    timePerKgMin: 4,
    timePerKgMax: 10,
    temperatureOptimal: 70,
    yieldPercent: { Au: 95, Ag: 20, Pt: 85, Pd: 80 },
    electricityKwhPerKg: 0.6
  },
  hno3_dilute: {
    name: "Kwas azotowy rozcie\u0144czony (HNO3 25-30%)",
    reagents: [
      {
        name: "Kwas azotowy rozcie\u0144czony (HNO3 25%)",
        concentration: 25,
        amountPerKg: 0.5,
        pricePerLiter: 22
      },
      {
        name: "Chlorek sodu (wytr\u0105canie AgCl)",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3
      },
      {
        name: "Cynk metaliczny \u2014 redukcja AgCl\u2192Ag",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 65
      },
      {
        name: "Kwas solny HCl \u2014 rozpuszczenie cynku z osadu",
        concentration: 35,
        amountPerKg: 0.05,
        pricePerLiter: 18
      }
    ],
    timePerKgMin: 2,
    timePerKgMax: 6,
    temperatureOptimal: 40,
    yieldPercent: { Au: 0, Ag: 85, Pt: 5, Pd: 10 },
    electricityKwhPerKg: 0.2
  },
  hno3_concentrated: {
    name: "Kwas azotowy st\u0119\u017Cony (HNO3 65%)",
    reagents: [
      {
        name: "Kwas azotowy st\u0119\u017Cony (HNO3 65%)",
        concentration: 65,
        amountPerKg: 0.4,
        pricePerLiter: 28
      },
      {
        name: "Chlorek sodu (wytr\u0105canie AgCl)",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3
      },
      {
        name: "Cynk metaliczny \u2014 redukcja AgCl\u2192Ag",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 65
      },
      {
        name: "Kwas solny HCl \u2014 rozpuszczenie cynku z osadu",
        concentration: 35,
        amountPerKg: 0.05,
        pricePerLiter: 18
      }
    ],
    timePerKgMin: 1,
    timePerKgMax: 4,
    temperatureOptimal: 35,
    yieldPercent: { Au: 0, Ag: 90, Pt: 0, Pd: 70 },
    electricityKwhPerKg: 0.15
  },
  hcl_h2o2: {
    name: "HCl + H2O2 (etching kwasowy)",
    reagents: [
      {
        name: "Kwas solny (HCl)",
        concentration: 35,
        amountPerKg: 0.5,
        pricePerLiter: 18
      },
      {
        name: "Nadtlenek wodoru (H2O2)",
        concentration: 30,
        amountPerKg: 0.2,
        pricePerLiter: 20
      },
      {
        name: "Wodorosiarczyn sodu \u2014 reduktor SMB (wytr\u0105canie Au)",
        concentration: 40,
        amountPerKg: 0.02,
        pricePerLiter: 12
      },
      {
        name: "Boraks (topnik do wytopu Au)",
        concentration: 99,
        amountPerKg: 5e-3,
        pricePerLiter: 10
      }
    ],
    timePerKgMin: 6,
    timePerKgMax: 16,
    temperatureOptimal: 45,
    yieldPercent: { Au: 90, Ag: 15, Pt: 60, Pd: 75 },
    electricityKwhPerKg: 0.3
  },
  nitrate_boat: {
    name: "\u0141\xF3d\u017A azotanowa (NaNO3 + H2SO4)",
    reagents: [
      {
        name: "Azotan sodu (NaNO3)",
        concentration: 99,
        amountPerKg: 0.15,
        pricePerLiter: 18
      },
      {
        name: "Kwas siarkowy (H2SO4)",
        concentration: 98,
        amountPerKg: 0.5,
        pricePerLiter: 28
      },
      {
        name: "Chlorek sodu (wytr\u0105canie AgCl)",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3
      },
      {
        name: "Wodorosiarczyn sodu \u2014 SMB (wytr\u0105canie Au)",
        concentration: 40,
        amountPerKg: 0.05,
        pricePerLiter: 12
      }
    ],
    timePerKgMin: 3,
    timePerKgMax: 8,
    temperatureOptimal: 90,
    yieldPercent: { Au: 85, Ag: 90, Pt: 30, Pd: 40 },
    electricityKwhPerKg: 0.8
  },
  electrolysis: {
    name: "Elektroliza (rafinacja elektrolityczna)",
    reagents: [
      {
        name: "Kwas azotowy (elektrolit bazowy)",
        concentration: 10,
        amountPerKg: 0.5,
        pricePerLiter: 18
      },
      {
        name: "Azotan z\u0142ota (Au(NO3)3, uzupe\u0142niacz elektrolitu)",
        concentration: 5,
        amountPerKg: 0.025,
        pricePerLiter: 1800
      },
      {
        name: "Boraks (topnik do wytopu anody)",
        concentration: 99,
        amountPerKg: 0.05,
        pricePerLiter: 10
      }
    ],
    timePerKgMin: 8,
    timePerKgMax: 24,
    temperatureOptimal: 30,
    yieldPercent: { Au: 99, Ag: 95, Pt: 60, Pd: 50 },
    electricityKwhPerKg: 2.5
  },
  wohlwill_process: {
    name: "Proces W\xF6hlwilla (rafinacja z\u0142ota 999.9)",
    reagents: [
      {
        name: "Kwas solny (elektrolit bazowy HCl 20%)",
        concentration: 20,
        amountPerKg: 1,
        pricePerLiter: 12
      },
      {
        name: "Chlorek z\u0142ota (AuCl3, uzupe\u0142niacz elektrolitu)",
        concentration: 10,
        amountPerKg: 0.05,
        pricePerLiter: 3200
      },
      {
        name: "Boraks (topnik do wytopu anod)",
        concentration: 99,
        amountPerKg: 0.02,
        pricePerLiter: 10
      }
    ],
    timePerKgMin: 24,
    timePerKgMax: 48,
    temperatureOptimal: 70,
    yieldPercent: { Au: 99.5, Ag: 0, Pt: 30, Pd: 20 },
    electricityKwhPerKg: 3
  },
  miller_process: {
    name: "Proces Millera (chloracja pirometalurgiczna)",
    reagents: [
      {
        name: "Chlor gazowy (Cl2)",
        concentration: 99,
        amountPerKg: 0.15,
        pricePerLiter: 38
      },
      {
        name: "Boraks (topnik)",
        concentration: 99,
        amountPerKg: 0.1,
        pricePerLiter: 10
      },
      {
        name: "Wodorotlenek sodu NaOH 30% (neutralizacja Cl2 w off-gazie)",
        concentration: 30,
        amountPerKg: 0.3,
        pricePerLiter: 8
      }
    ],
    timePerKgMin: 0.5,
    timePerKgMax: 2,
    temperatureOptimal: 1100,
    yieldPercent: { Au: 98, Ag: 0, Pt: 20, Pd: 10 },
    electricityKwhPerKg: 5
  },
  cementation_zinc: {
    name: "Cementacja cynkiem (wytr\u0105canie Au)",
    reagents: [
      {
        name: "Cynk metaliczny (granulki Zn)",
        concentration: 99,
        amountPerKg: 0.1,
        pricePerLiter: 65
      },
      {
        name: "\u0141ug cyjanku sodu (NaCN, opcjonalny \u2014 do \u0142ugowania)",
        concentration: 5,
        amountPerKg: 0.3,
        pricePerLiter: 40
      },
      {
        name: "Kwas solny HCl (rozpuszczenie cynku z osadu Au+Zn)",
        concentration: 35,
        amountPerKg: 0.1,
        pricePerLiter: 18
      }
    ],
    timePerKgMin: 3,
    timePerKgMax: 6,
    temperatureOptimal: 25,
    yieldPercent: { Au: 80, Ag: 75, Pt: 20, Pd: 30 },
    electricityKwhPerKg: 0.1
  }
};
function computeParameterYieldMultiplier(processId, baseYield, acidConcentrationOverride, temperatureOverride, processOptimalTemp, processDefaultConc) {
  let multiplier = 1;
  if (acidConcentrationOverride !== void 0 && processDefaultConc !== void 0) {
    const ratio = acidConcentrationOverride / processDefaultConc;
    if (ratio < 0.5) {
      multiplier *= 0.7;
    } else if (ratio < 0.8) {
      multiplier *= 0.85 + (ratio - 0.5) * 0.5;
    } else if (ratio <= 1.2) {
      multiplier *= 1;
    } else if (ratio <= 1.5) {
      multiplier *= 0.98;
    } else {
      multiplier *= 0.95;
    }
  }
  if (temperatureOverride !== void 0 && processOptimalTemp !== void 0) {
    const diff = Math.abs(temperatureOverride - processOptimalTemp);
    if (diff === 0) {
      multiplier *= 1;
    } else if (diff <= 10) {
      multiplier *= 1 - diff * 2e-3;
    } else if (diff <= 25) {
      multiplier *= 0.98 - (diff - 10) * 8e-3;
    } else {
      multiplier *= Math.max(0.6, 0.86 - (diff - 25) * 0.01);
    }
  }
  const adjusted = baseYield * multiplier;
  return Math.min(99.5, Math.max(0, adjusted));
}
router5.post("/calculator/estimate", async (req, res) => {
  const body = req.body;
  if (!body.batch || !Array.isArray(body.batch) || body.batch.length === 0 || !body.processId) {
    res.status(400).json({ error: "Invalid request: batch and processId required" });
    return;
  }
  if (body.batch.length > 50) {
    res.status(400).json({ error: "Batch too large: maximum 50 items allowed" });
    return;
  }
  if (body.acidConcentrationOverride !== void 0 && (typeof body.acidConcentrationOverride !== "number" || !isFinite(body.acidConcentrationOverride) || body.acidConcentrationOverride <= 0 || body.acidConcentrationOverride > 100)) {
    res.status(400).json({ error: "acidConcentrationOverride must be a number between 0 and 100" });
    return;
  }
  if (body.temperatureOverride !== void 0 && (typeof body.temperatureOverride !== "number" || !isFinite(body.temperatureOverride) || body.temperatureOverride < -20 || body.temperatureOverride > 1500)) {
    res.status(400).json({ error: "temperatureOverride must be a number between -20 and 1500 \xB0C" });
    return;
  }
  if (body.electricityPricePerKwh !== void 0 && (typeof body.electricityPricePerKwh !== "number" || !isFinite(body.electricityPricePerKwh) || body.electricityPricePerKwh < 0 || body.electricityPricePerKwh > 1e4)) {
    res.status(400).json({ error: "electricityPricePerKwh must be a number between 0 and 10000" });
    return;
  }
  const process2 = chemicalProcessesMap[body.processId];
  if (!process2) {
    res.status(400).json({ error: `Unknown processId: ${body.processId}` });
    return;
  }
  const unknownMaterials = body.batch.filter((item) => !electronicMaterialsMap[item.materialId]).map((item) => item.materialId);
  if (unknownMaterials.length > 0) {
    res.status(400).json({
      error: `Unknown material IDs: ${unknownMaterials.join(", ")}`
    });
    return;
  }
  if (body.reagentPriceOverrides) {
    const invalidPrices = Object.entries(body.reagentPriceOverrides).filter(
      ([, v]) => typeof v !== "number" || !isFinite(v) || v <= 0 || v > 1e5
    );
    if (invalidPrices.length > 0) {
      res.status(400).json({
        error: `Invalid reagentPriceOverrides: prices must be finite numbers between 0 and 100000 PLN/L`
      });
      return;
    }
  }
  const invalidQuantities = body.batch.filter(
    (item) => typeof item.quantity !== "number" || item.quantity <= 0
  );
  if (invalidQuantities.length > 0) {
    res.status(400).json({
      error: "All batch quantities must be positive numbers"
    });
    return;
  }
  const metalPrices = await getOrFetchPrices();
  let totalMassKg = 0;
  const totalMetalsGPerKg = { Au: 0, Ag: 0, Pt: 0, Pd: 0 };
  for (const item of body.batch) {
    const material = electronicMaterialsMap[item.materialId];
    let massKg;
    if (material.unit === "piece") {
      const weightPerPiece = material.weightPerPiece ?? 0.1;
      massKg = item.quantity * weightPerPiece;
    } else {
      massKg = item.quantity;
    }
    totalMassKg += massKg;
    totalMetalsGPerKg.Au += material.metalContentPerKg.Au.typical * massKg;
    totalMetalsGPerKg.Ag += material.metalContentPerKg.Ag.typical * massKg;
    totalMetalsGPerKg.Pt += material.metalContentPerKg.Pt.typical * massKg;
    totalMetalsGPerKg.Pd += material.metalContentPerKg.Pd.typical * massKg;
  }
  const processDefaultConc = process2.reagents[0]?.concentration;
  const processOptimalTemp = process2.temperatureOptimal;
  const metals = ["Au", "Ag", "Pt", "Pd"];
  const recoveredMetals = metals.map((metal) => {
    const totalGrams = totalMetalsGPerKg[metal];
    const baseYield = process2.yieldPercent[metal];
    const adjustedYield = computeParameterYieldMultiplier(
      body.processId,
      baseYield,
      body.acidConcentrationOverride,
      body.temperatureOverride,
      processOptimalTemp,
      processDefaultConc
    );
    const yieldFraction = adjustedYield / 100;
    const recovered = totalGrams * yieldFraction;
    const price = metalPrices[metal];
    const value = recovered * price;
    return {
      metal,
      massGrams: Math.round(recovered * 1e3) / 1e3,
      pricePerGram: price,
      totalValuePln: Math.round(value * 100) / 100,
      yieldPercent: Math.round(adjustedYield * 10) / 10
    };
  });
  const electricityPricePerKwh = body.electricityPricePerKwh ?? 0.8;
  const concOverride = body.acidConcentrationOverride;
  const concFactor = concOverride !== void 0 && processDefaultConc !== void 0 && concOverride > 0 ? Math.pow(processDefaultConc / concOverride, 0.7) : 1;
  const electricityConcFactor = Math.max(0.4, Math.min(1.5, concFactor));
  const electricityCostPln = process2.electricityKwhPerKg * totalMassKg * electricityPricePerKwh * electricityConcFactor;
  const reagentPriceOverrides = body.reagentPriceOverrides ?? {};
  const chemistryCosts = process2.reagents.map((reagent, idx) => {
    let baseAmountPerKg = reagent.amountPerKg;
    let basePrice = reagentPriceOverrides[reagent.name] !== void 0 ? reagentPriceOverrides[reagent.name] : reagent.pricePerLiter;
    let effectiveAmountPerKg = baseAmountPerKg;
    let effectivePrice = basePrice;
    if (idx === 0 && concOverride !== void 0 && processDefaultConc !== void 0 && concOverride > 0 && reagent.concentration > 0) {
      const volFactor = reagent.concentration / concOverride;
      effectiveAmountPerKg = baseAmountPerKg * volFactor;
      effectivePrice = basePrice / volFactor;
    }
    const amountLiters = effectiveAmountPerKg * totalMassKg;
    const totalCost = amountLiters * effectivePrice;
    return {
      reagentName: reagent.name,
      amountLiters: Math.round(amountLiters * 100) / 100,
      pricePerLiter: Math.round(effectivePrice * 100) / 100,
      totalCostPln: Math.round(totalCost * 100) / 100
    };
  });
  const totalChemistryCostPln = chemistryCosts.reduce((sum, c) => sum + c.totalCostPln, 0) + electricityCostPln;
  const totalRevenuePln = recoveredMetals.reduce(
    (sum, m) => sum + m.totalValuePln,
    0
  );
  const totalCostPln = totalChemistryCostPln;
  const netProfitPln = totalRevenuePln - totalCostPln;
  const profitMargin = totalRevenuePln > 0 ? netProfitPln / totalRevenuePln : -1;
  let profitabilityRating;
  let profitabilityNote;
  if (profitMargin > 0.5) {
    profitabilityRating = "very_profitable";
    profitabilityNote = `Bardzo op\u0142acalne! Mar\u017Ca ${Math.round(profitMargin * 100)}%. Zysk netto ${netProfitPln.toFixed(2)} PLN.`;
  } else if (profitMargin > 0.2) {
    profitabilityRating = "profitable";
    profitabilityNote = `Op\u0142acalne. Mar\u017Ca ${Math.round(profitMargin * 100)}%. Zysk netto ${netProfitPln.toFixed(2)} PLN.`;
  } else if (profitMargin > 0) {
    profitabilityRating = "marginal";
    profitabilityNote = `Marginalna op\u0142acalno\u015B\u0107. Mar\u017Ca tylko ${Math.round(profitMargin * 100)}%. Rozwa\u017C inny proces lub wsad.`;
  } else {
    profitabilityRating = "not_profitable";
    profitabilityNote = `Nieop\u0142acalne. Koszty chemii (${totalCostPln.toFixed(2)} PLN) przekraczaj\u0105 warto\u015B\u0107 odzysku (${totalRevenuePln.toFixed(2)} PLN). Zwi\u0119ksz materia\u0142 wsadu lub zmie\u0144 proces.`;
  }
  const avgTimePerKg = (process2.timePerKgMin + process2.timePerKgMax) / 2;
  let estimatedTimeHours = avgTimePerKg * totalMassKg;
  if (body.temperatureOverride !== void 0 && processOptimalTemp !== void 0) {
    const tempFactor = 1 + (processOptimalTemp - body.temperatureOverride) * 0.01;
    estimatedTimeHours = Math.max(avgTimePerKg * 0.5, estimatedTimeHours * Math.max(0.5, Math.min(2, tempFactor)));
  }
  if (concOverride !== void 0 && processDefaultConc !== void 0 && concOverride > 0) {
    const timeConcFactor = Math.max(0.4, Math.min(1.5, Math.pow(processDefaultConc / concOverride, 0.7)));
    estimatedTimeHours = Math.max(process2.timePerKgMin * 0.4 * totalMassKg, estimatedTimeHours * timeConcFactor);
  }
  res.json({
    totalInputMassKg: Math.round(totalMassKg * 1e3) / 1e3,
    processId: body.processId,
    processName: process2.name,
    estimatedTimeHours: Math.round(estimatedTimeHours * 10) / 10,
    recoveredMetals,
    chemistryCosts,
    electricityCostPln: Math.round(electricityCostPln * 100) / 100,
    totalChemistryCostPln: Math.round(totalChemistryCostPln * 100) / 100,
    totalRevenuePln: Math.round(totalRevenuePln * 100) / 100,
    totalCostPln: Math.round(totalCostPln * 100) / 100,
    netProfitPln: Math.round(netProfitPln * 100) / 100,
    profitabilityRating,
    profitabilityNote,
    metalPricesSnapshot: metalPrices
  });
});
var calculator_default = router5;

// src/routes/index.ts
var router6 = (0, import_express6.Router)();
router6.use(health_default);
router6.use(metals_default);
router6.use(materials_default);
router6.use(chemicals_default);
router6.use(calculator_default);
var index_default = router6;
