import { runTestCases } from '../testcases'

describe('browser testcases', () => {
    it('jest testcases', () => {
        expect(runTestCases(true)).toBe('Test tescases ok!')
    })
    it('all testcases', () => {
        expect(runTestCases(false).split('\n')[0]).toMatch(/^.*(; 0 Failed\.)$/)
    })
})
