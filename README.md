# @cheatron/native-mock-koffi

Pure JavaScript mock of [Koffi](https://koffi.dev/) for testing native modules without native dependencies.

## Installation

```bash
bun add @cheatron/native-mock-koffi
```

## Usage

```typescript
import MockKoffi from "@cheatron/native-mock-koffi";

const buffer = MockKoffi.alloc("uint32");
const address = MockKoffi.address(buffer);
```

## License

MIT
