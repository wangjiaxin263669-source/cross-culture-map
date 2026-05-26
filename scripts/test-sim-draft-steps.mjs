/**
 * 单元测试：各步骤是否应触发退出保存
 */
import { shouldPersistSimDraft } from '../src/utils/simResearchDraft.js';

const cases = [
  { name: '设定-主题', payload: { step: 'setup', researchTopic: '二次元' }, want: true },
  { name: '设定-人群', payload: { step: 'setup', audienceCriteria: '18-28' }, want: true },
  { name: '人设完成', payload: { step: 'personas', personas: [{ id: 'p1', name: 'A' }] }, want: true },
  {
    name: '访谈进行中',
    payload: {
      step: 'interviews',
      personas: [{ id: 'p1' }],
      interviews: [{ personaId: 'p1', personaName: 'A', summary: 's', transcript: [] }],
    },
    want: true,
  },
  {
    name: '报告完成',
    payload: { step: 'report', report: '# 报告', interviews: [{ personaId: 'p1' }] },
    want: true,
  },
  { name: '空素材步', payload: { step: 'materials' }, want: false },
];

let failed = 0;
for (const c of cases) {
  const got = shouldPersistSimDraft(c.payload);
  if (got !== c.want) {
    console.error(`FAIL ${c.name}: got ${got}, want ${c.want}`);
    failed += 1;
  } else {
    console.log(`OK ${c.name}`);
  }
}
process.exit(failed ? 1 : 0);
