import _ from 'lodash'
import CodeGeneratorBase, { CodeGeneratorBaseSettings } from './CodeGeneratorBase'
import { CodeGenNative, CodeGenParam, CodeGenType } from './ICodeGenerator'

export interface ZigCodeGeneratorSettings extends CodeGeneratorBaseSettings {
  generateComments  : boolean
  useNativeTypes    : boolean
  zigCompliant      : boolean
  includes          : string
  invokeFunction    : string
  oneLineFunctions  : boolean
  includeNdbLinks   : boolean
}

export default
class ZigCodeGenerator extends CodeGeneratorBase<ZigCodeGeneratorSettings> {
  private camelCase(str: string): string {
    const ans = str.toLowerCase()

    return ans.split('_').reduce((s, c) => s
          + (c.charAt(0).toUpperCase() + c.slice(1)))
  }

  private snakeCase(str: string): string {
    return str.split('').reduce((s, c) => s
          + (c === c.toUpperCase() ? `_${c.toLowerCase()}` : c), '')
  }

  private transformZigKeyword(type: string): string {
    switch (type) {
      // Zig keywords
      case 'addrspace'      :
      case 'align'          :
      case 'allowzero'      :
      case 'and'            :
      case 'anyframe'       :
      case 'anytype'        :
      case 'asm'            :
      case 'async'          :
      case 'await'          :
      case 'break'          :
      case 'callconv'       :
      case 'catch'          :
      case 'comptime'       :
      case 'const'          :
      case 'continue'       :
      case 'defer'          :
      case 'else'           :
      case 'enum'           :
      case 'errdefer'       :
      case 'error'          :
      case 'export'         :
      case 'extern'         :
      case 'fn'             :
      case 'for'            :
      case 'if'             :
      case 'inline'         :
      case 'linksection'    :
      case 'noalias'        :
      case 'noinline'       :
      case 'nosuspend'      :
      case 'opaque'         :
      case 'or'             :
      case 'orelse'         :
      case 'packed'         :
      case 'pub'            :
      case 'resume'         :
      case 'return'         :
      case 'struct'         :
      case 'suspend'        :
      case 'switch'         :
      case 'test'           :
      case 'threadlocal'    :
      case 'try'            :
      case 'type'           : // Isn't a keyword in Zig, but still not allowed as an identifier
      case 'union'          :
      case 'unreachable'    :
      case 'usingnamespace' :
      case 'var'            :
      case 'volatile'       :
      case 'while'          : type = `@"${type}"`; break
      default               : break
    }
    return type
  }

  private transformNativeName(name: string): string {
    let n = name
    if (name.startsWith('_0x')) {
      n = `@"${name.slice(1)}"`
    }
    else if (name.startsWith('_')) {
      n = `${this.settings.zigCompliant ? this.camelCase(name.slice(1)) : name.slice(1)}_`
    }
    else {
      n = this.settings.zigCompliant ? this.camelCase(name) : name
    }
    n = this.transformZigKeyword(n)
    return n
  }

  private transformParamName(name: string): string {
    const n = this.settings.zigCompliant ? this.snakeCase(name) : name
    return this.transformZigKeyword(n)
  }

  private transformZigType(type: string): string {
    switch (type) {
      // C ABI types
      // Fixed-width types
      case 'int8_t'            : return 'i8'
      case 'uint8_t'           : return 'u8'
      case 'int16_t'           : return 'i16'
      case 'uint16_t'          : return 'u16'
      case 'int32_t'           : return 'i32'
      case 'uint32_t'          : return 'u32'
      case 'int64_t'           : return 'i64'
      case 'uint64_t'          : return 'u64'
      case '__int128'          :
      case 'signed __int128'   : return 'i128'
      case 'unsigned __int128' : return 'u128'
      // Basic types
      //case 'void'              : return 'anyopaque'
      case 'char'              : // Zig uses u8 for char
      case 'signed char'       :
      case 'unsigned char'     : return 'u8'
      case 'short'             : 
      case 'signed short'      : return 'c_short'
      case 'unsigned short'    : return 'c_ushort'
      case 'int'               :
      case 'signed int'        : return 'c_int'
      case 'unsigned int'      : return 'c_uint'
      case 'long'              : 
      case 'signed long'       : return 'c_long'
      case 'unsigned long'     : return 'c_ulong'
      case 'long long'         : 
      case 'signed long long'  : return 'c_longlong'
      case 'unsigned long long': return 'c_ulonglong'
      // Pointer types
      case 'intptr_t'          : return 'isize'
      case 'uintptr_t'         : return 'usize'
      // Floating-point types
      case 'long double'       : return 'c_longdouble'
      case '_Float16'          : return 'f16'
      case 'float'             : return 'f32'
      case 'double'            : return 'f64'
      case '_Float128'         : return 'f128'
      // Windows API types
      case 'BOOL'              : 
      case 'BYTE'              : 
      case 'WORD'              : 
      case 'HANDLE'            : 
      case 'HMODULE'           : 
      case 'DWORD'             : return 'windows.' + type
      // RAGE types
      case 'Void'              : 
      case 'Any'               : 
      case 'uint'              : 
      case 'Hash'              : 
      case 'Blip'              : 
      case 'Cam'               : 
      case 'Camera'            : 
      case 'CarGenerator'      : 
      case 'ColourIndex'       : 
      case 'CoverPoint'        : 
      case 'Entity'            : 
      case 'FireId'            : 
      case 'Group'             : 
      case 'Interior'          : 
      case 'Object'            : 
      case 'Ped'               : 
      case 'Pickup'            : 
      case 'Player'            : 
      case 'ScrHandle'         : 
      case 'Sphere'            : 
      case 'TaskSequence'      : 
      case 'Texture'           : 
      case 'TextureDict'       : 
      case 'Train'             : 
      case 'Vehicle'           : 
      case 'Weapon'            : 
      case 'Vector2'           : 
      case 'Vector3'           : 
      case 'Vector4'           : return 'types.' + type
      default                  : return type
    }
  }

  start(): this {
    return super.start()
      .writeComment(`Generated on ${new Date().toLocaleString()}`)
      .writeComment(`${window.location.origin}`)
      .writeBlankLine()
      .writeComment('Expected invoker signature:')
      .writeComment('`pub inline fn invoke(comptime R: type, hash: u64, args: anytype) R { ... }`')
      .writeBlankLine()
      .writeLine('const windows = @import("std").os.windows;')
      .writeBlankLine()
      .writeLine(this.settings.includes)
      .writeBlankLine()
      .writeLine('// zig fmt: off')
      .writeBlankLine()
  }

  end(): this {
    return this
      .writeLine('// zig fmt: on')
      .writeBlankLine()
  }

  transformBaseType(type: string): string {
    if (!this.settings.useNativeTypes) {
      return type
    }

    switch (type) {
      case 'Void'         : return 'windows.DWORD'
      case 'Any'          : return 'windows.DWORD'
      case 'uint'         : return 'windows.DWORD'
      case 'Hash'         : return 'windows.DWORD'
      case 'Blip'         : return 'c_int'
      case 'Cam'          : return 'c_int'
      case 'Camera'       : return 'c_int'
      case 'CarGenerator' : return 'c_int'
      case 'ColourIndex'  : return 'c_int'
      case 'CoverPoint'   : return 'c_int'
      case 'Entity'       : return 'c_int'
      case 'FireId'       : return 'c_int'
      case 'Group'        : return 'c_int'
      case 'Interior'     : return 'c_int'
      case 'Object'       : return 'c_int'
      case 'Ped'          : return 'c_int'
      case 'Pickup'       : return 'c_int'
      case 'Player'       : return 'c_int'
      case 'ScrHandle'    : return 'c_int'
      case 'Sphere'       : return 'c_int'
      case 'TaskSequence' : return 'c_int'
      case 'Texture'      : return 'c_int'
      case 'TextureDict'  : return 'c_int'
      case 'Train'        : return 'c_int'
      case 'Vehicle'      : return 'c_int'
      case 'Weapon'       : return 'c_int'
      default             : return type
    }
  }

  addNative(native: CodeGenNative): this {
    const name         = this.transformNativeName(native.name)
    const params       = native.params.map(({ type, name }) => `${this.transformParamName(name)}: ${this.formatType(type)}`).join(', ')
    const invokeParams = [ native.hash, ...native.params.map(s => this.formatInvokeParam(s)) ].join(', ')
    const returnType   = this.formatType(native.returnType)
    const returnString = returnType === this.transformZigType('void')
      ? '' 
      : 'return ' 
    const invokeReturn = returnType
    const invoker      = this.settings.invokeFunction
    const link         = `${window.location.origin}/natives/${native.hash}`

    this.formatComment = this._formatDocs

    let comment = native.comment
    comment = comment
      .replaceAll('\t', this.settings.indentation) // Tab isn't supported in Zig docs
    
    // Split comment into lines
    // and add backslashes to the end of lines that aren't the last, empty nor indented lines
    const commentLines = comment.split('\n')
    if (commentLines.length > 1) {
      for (let i = 1; i <= commentLines.length - 1; ++i) {
        if (commentLines[i].trim().length > 0 && commentLines[i - 1].trim().length > 0 && !commentLines[i - 1].startsWith('  ')) {
          commentLines[i - 1] += ' \\'
        }
      }
    }
    comment = commentLines.join('\n')

    let ret = this
      .conditional(this.settings.generateComments, gen => gen.writeComment(comment))
      .conditional(this.settings.generateComments && this.settings.includeNdbLinks && !!native.comment, gen => gen.writeComment(' '))
      .conditional(this.settings.includeNdbLinks, gen => gen.writeComment(link))

    this.formatComment = this._formatComment

    ret = ret
      .writeLine(`pub fn ${name}(${params}) ${returnType}`)
      .pushBranch(this.settings.oneLineFunctions)
      .writeLine(`${returnString}invoker.${invoker}(${invokeReturn}, ${invokeParams.split(', ').at(0)}, .{${invokeParams.split(', ').slice(1).join(', ')}});`)
      .popBranchWithComment(`${native.hash} ${native.jhash} ${native.build ? `b${native.build}` : ''}`)
  
    return ret
  }

  pushNamespace(name: string): this {
    let n = this.settings.zigCompliant ? name.toLowerCase() : name
    n = n.charAt(0).toUpperCase() + n.slice(1)

    return this
      .writeLine(`pub const ${n} = struct`)
      .pushBranch(false)
  }

  popNamespace(): this {
    const oldBracket = this.getClosingBracket()
    this.getClosingBracket = () => '};'

    const ret = this
      .popBranch()
      .writeBlankLine()

    this.getClosingBracket = () => oldBracket

    return ret
  }

  private _formatDocs(comment: string): string {
    return `/// ${comment}`
  }

  private _formatComment(comment: string): string {
    return `// ${comment}`
  }

  protected formatComment(comment: string): string {
    return this._formatComment(comment)
  }

  protected getOpeningBracket(): string | null {
    return '{'
  }

  protected getClosingBracket(): string | null {
    return '}'
  }

  private formatType(type: CodeGenType): string {
    const { baseType } = type

    const zigType = this.transformZigType(baseType)

    if (type.isConst && type.pointers) {
      return `${'[*c]'.repeat(type.pointers)}const ${zigType}`
    }

    // Not pointer constant isn't valid in Zig
    return `${'[*c]'.repeat(type.pointers)}${zigType}`
  }

  private formatInvokeParam({ name, type }: CodeGenParam): string {
    const n = this.settings.zigCompliant ? this.transformParamName(name) : name
  
    if (!type.pointers) {
      switch (type.baseType) {
        case 'Vector2':
          return `${n}.x, ${n}.y`
        case 'Vector3':
          return `${n}.x, ${n}.y, ${n}.z`
        case 'Vector4':
          return `${n}.x, ${n}.y, ${n}.z, ${n}.w`
      }
    }

    return n
  }
}
