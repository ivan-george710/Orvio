import assert from 'node:assert/strict';

// Responses are queued explicitly. Unexpected calls fail instead of returning
// empty success data, which could hide a missing authorization or filter step.
export function supabaseStub({ user = { id: 'participant-id' }, authError = null, plans = [] } = {}) {
  const pending = [...plans];
  const requests = [];
  const authentication = [];
  let clientCreations = 0;

  function query(kind, target, args) {
    assert.ok(pending.length, `Unexpected ${kind} request: ${target}`);
    const plan = pending.shift();
    assert.equal(kind, plan.kind || 'from', 'Request kind');
    assert.equal(target, plan.target, 'Table or RPC name');
    if (plan.args !== undefined) assert.deepEqual(args, plan.args);
    const request = { kind, target, args, calls: [] };
    requests.push(request);
    const chain = {};
    for (const method of [
      'select', 'eq', 'or', 'ilike', 'order', 'range', 'returns',
      'maybeSingle', 'single', 'update', 'delete', 'insert',
    ]) {
      chain[method] = (...values) => {
        request.calls.push([method, ...values]);
        return chain;
      };
    }
    chain.then = (resolve, reject) => {
      if (plan.reject) return Promise.reject(plan.reject).then(resolve, reject);
      return Promise.resolve(plan.result ?? { data: [], error: null }).then(resolve, reject);
    };
    return chain;
  }

  const client = {
    auth: {
      getUser: async () => {
        authentication.push('getUser');
        return { data: { user }, error: authError };
      },
    },
    from: (name) => query('from', name),
    rpc: (name, args) => query('rpc', name, args),
  };

  return {
    client,
    requests,
    authentication,
    createClient: async () => {
      clientCreations += 1;
      return client;
    },
    get clientCreations() { return clientCreations; },
    assertDone() {
      assert.equal(pending.length, 0, 'Every planned database request must be consumed');
    },
  };
}

export function callsFor(request, method) {
  return request.calls.filter((call) => call[0] === method);
}

export function assertCall(request, method, ...args) {
  assert.ok(
    request.calls.some((call) => JSON.stringify(call) === JSON.stringify([method, ...args])),
    `Expected ${method}(${args.map(String).join(', ')}) for ${request.target}`,
  );
}
