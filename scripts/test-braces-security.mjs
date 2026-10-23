import test from 'node:test';
import assert from 'node:assert/strict';
import braces from 'braces';

test('normal compilation, expansion, escaping, and nested alternatives remain compatible', () => {
  assert.deepEqual(braces('src/*.{js,jsx,ts,tsx}'), ['src/*.(js|jsx|ts|tsx)']);
  assert.deepEqual(braces.expand('a{b,c}{1..3}'), ['ab1','ab2','ab3','ac1','ac2','ac3']);
  assert.deepEqual(braces.expand('{a,{b,c}}'), ['a','b','c']);
  assert.deepEqual(braces('a\\{b,c\\}'), ['a{b,c}']);
  assert.equal(braces.stringify(braces.parse('a/{b,c}/d')), 'a/{b,c}/d');
});

test('deep strings are rejected before recursive walkers exhaust the stack', () => {
  for (const [left,right] of [['{','}'],['(',')']]) {
    const input=left.repeat(4000)+'a'+right.repeat(4000);
    for (const operation of [braces,braces.parse,braces.compile,braces.expand,braces.stringify]) {
      assert.throws(()=>operation(input), {name:'SyntaxError',message:/nesting depth/});
    }
  }
});

test('direct AST inputs cannot bypass depth and cycle bounds', () => {
  let ast={type:'text',value:'a'};
  for(let i=0;i<200;i++) ast={type:'root',nodes:[ast]};
  const cycle={type:'root',nodes:[]};cycle.nodes.push(cycle);
  for(const operation of [braces.compile,braces.expand,braces.stringify]) {
    assert.throws(()=>operation(ast), {name:'SyntaxError',message:/depth or size/});
    assert.throws(()=>operation(cycle), {name:'SyntaxError',message:/depth or size/});
  }
});

test('ordinary depth and upstream expansion limits are preserved', () => {
  assert.doesNotThrow(()=>braces('{'.repeat(64)+'a'+'}'.repeat(64)));
  assert.throws(()=>braces.expand('{1..100000}'), /range limit/);
});
