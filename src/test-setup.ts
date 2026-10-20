// Test setup: adds the jest-dom matchers and unmounts rendered components between tests.
//
// Testing Library only auto-cleans when the test runner exposes global `afterEach`, and this
// project imports vitest functions explicitly instead of using globals, so we register it here.

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)
