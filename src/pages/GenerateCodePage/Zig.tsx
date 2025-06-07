import { ZigCodeGenerator } from '../../code-generation'
import Language from './Language'


export default function Zig() {
  return (
    <Language
      advancedOptions={[
        {
          type:    'combo',
          label:   'Indentation',
          prop:    'indentation',
          options: [
            {
              label: '1 Space',
              value: ' ' 
            },
            {
              label: '2 Spaces',
              value: '  ' 
            },
            {
              label: '4 Spaces',
              value: '    ' 
            },
            {
              label: '8 Spaces',
              value: '        ' 
            }
          ]
        },
        {
          type:    'combo',
          label:   'Line Endings',
          prop:    'lineEnding',
          options: [
            {
              label: 'LF',
              value: 'lf' 
            },
            {
              label: 'CR-LF',
              value: 'crlf' 
            }
          ]
        },
        {
          type:  'multi',
          label: 'Includes',
          prop:  'includes'
        },
        {
          type:  'string',
          label: 'Invoke Function',
          prop:  'invokeFunction'
        }
      ]}
      defaultSettings={{
        indentation:      '    ',
        lineEnding:       'lf',
        compactVectors:   true,
        generateComments: true,
        useNativeTypes:   false,
        zigCompliant:     true,
        includes:         'const invoker = @import("invoker.zig");\nconst types = @import("types.zig");',
        invokeFunction:   'invoke',
        oneLineFunctions: true,
        includeNdbLinks:  false
      }}
      extension="zig"
      generator={ZigCodeGenerator}
      name="zig"
      options={[
        {
          type:  'boolean',
          label: 'Include Comments',
          prop:  'generateComments'
        },
        {
          type:  'boolean',
          label: 'Include Links',
          prop:  'includeNdbLinks'
        },
        {
          type:  'boolean',
          label: 'Native Types',
          prop:  'useNativeTypes'
        },
        {
          type:  'boolean',
          label: 'Compact Vectors',
          prop:  'compactVectors'
        },
        {
          type:  'boolean',
          label: 'One Line Functions',
          prop:  'oneLineFunctions'
        },
        {
          type:  'boolean',
          label: 'Zig Compliant',
          prop:  'zigCompliant'
        }
      ]}
    />
  )
}
