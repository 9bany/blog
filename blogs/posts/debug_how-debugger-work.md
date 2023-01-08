---
title: Debugger hoạt động thế nào ? 
author: rony
publish_date: 2023-01-08T00:00:00.000Z
abstract: Chui vào xem sao =)) 
---
Và giờ thì! `Chitty Chitty Chat Chat`.

![bug!!](./../bug.JPG)

Trong bài viết này, thay vì debug chương trình của tôi, tôi sẽ debug chương trình debug :) 
## Ta có thể làm gì với debugger?

- Chạy một chương trình, xem chương trình đi từ đoạn `code` nào đến đoạn `code` nào.
- Đặt `breakpoint` và có thể xem giá trị của những biến tại nơi đặt `breakpoint`.
- Thực thi một biểu thức hay gọi `functions` trong quá trình `debug`.
- Thay đổi `process's code on-the-fly` và quan sát kết qủa.

Tools hổ trợ debug.
- Go: [delve](https://github.com/go-delve/delve)
- Rust: [rust-analyzer](https://github.com/rust-lang/rust-analyzer)

Về cơ bản thì debugger đã hoạt động ra sao ?

## Linux - `ptrace`
`ptrace` là một `system_call` trong `linux`, nó cho phép một `process (debugger/tracer)` có thể quán sát và xử lý thực thi một `process(target/tracee)` khác và có thể xem/thay đổi memory của nó.

Bạn có thể xem thêm ở [đây](https://man7.org/linux/man-pages/man2/ptrace.2.html).
## Instruction stream, program counter
Trong đoạn code dưới đây. 

```golang
// main.go file
package main

import "fmt"

func main() {
	name := "rony"
	fmt.Println("Hello: ", name)
}

```

- Chúng ta sẽ hiểu `code follow` như sau: khởi tạo `package` --> `import` thư viện --> chạy hàm `main`. Chúng ta sẽ đi `line by line` để hiểu `code` chạy như thế nào, Right ?.
- Trên thực tế thì máy tính cũng hiểu như thế, nhưng thay vì `code lines` thì computer sẽ hiểu dựa trên mã máy và địa chỉ thực thi code trong [call stack](https://en.wikipedia.org/wiki/Call_stack).

Program counter(PC) (hay còn gọi là instruction pointer (IP)) là một [processor register](https://en.wikipedia.org/wiki/Processor_register) thể hiện computer đang ở đâu trong chương trình.


## Build debugger

Chúng ta sẽ dùng lại đoạn code cũ ở trên.

```golang
// main.go file
package main

import "fmt"

func main() {
	name := "rony"
	fmt.Println("Hello: ", name)
}

```

Tools dùng để bugger golang (vd: [delve](https://github.com/go-delve/delve)) thì có vẻ rất lớn và phức tạp, trong khi nền tảng để xây dựng chúng thì lại khá là đơn giản, Tools debug sử dụng services được cung cấp bởi hệ điều hành như tôi có nhắc ở phần trên [linux-ptrace](#linux---ptrace).

Cho nên, chúng ta sẽ viết một chương trình đơn giản chạy trên `linux` để debug đoạn code trên. All the rest is just a [simple matter of programming](https://en.wikipedia.org/wiki/Small_matter_of_programming)

### 1. Build binary 
Code structure tôi sẽ để như sau:
```
├── hello
│   └── main.go        	# <-- đây là chương trình cần debug
├── main.go				# <-- đây là chường trình debug
```
Chúng ta sẽ build chương trình code ở trên với `-gcflags=all="-N -l"`. Tôi sẽ để [link](https://go.dev/doc/gdb) ở đây. để biết tại sao mình lại cần `flags` đó.
```
$ go build -gcflags=all="-N -l" main.go
```
Sau khi build xong !
```
├── hello
│   ├── main 			# <-- binary file sau khi build
│   └── main.go        	# <-- đây là chương trình cần debug
├── main.go				# <-- đây là chường trình debug
```

### 2. Let's build debugger 

Chúng sẽ ta chạy `binary` đã build ở trên với `ptrace()` mode trong `linux`.
```
	target := "hello/main"
	cmd := exec.Command(target)
	// set SysProcAttr với Ptrace: true
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Ptrace: true,
	}

	cmd.Start()
```
PID, Systable
- Để `set breakpoint` cần số `pid`, `fileName` và `line`.

```
pid := cmd.Process.Pid # lấy số pid

symTable = getSymbolTable(target)

fn = symTable.LookupFunc("main.main")
targetfile, line, fn = symTable.PCToLine(fn.Entry) # Lấy thông tin file, fn và số line của fn.
```
- Số `pid` ở đây chính là `child process` của bạn (hay chính là chương trình bạn muốn `debug`) cụ thể hơn là chương trình `"hello/main"` của bạn.

SetBreakpoint, Replace code.

- Bạn có thể thay đổi số `line` mà bạn muốn đặt `breakpoint`. (vd: số line là 10 chẳng hạn)

```
func setBreak(pid int, filename string, line int) (bool, []byte) {
	var err error
	pc, _, err = symTable.LineToPC(filename, line)
	if err != nil {
		fmt.Printf("Can't find breakpoint for %s, %d\n", filename, line)
		return false, []byte{}
	}

	// fmt.Printf("Stopping at %X\n", pc)
	return true, replaceCode(pid, pc, []byte{0xCC})
}
```
- `LineToPC`: Chuyển `fileName` và `line` thành `PC` và cũng có hàm làm ngược lại là `PCtoLine`.

Peek and poke
```
func replaceCode(pid int, breakpoint uint64, code []byte) []byte {
	original := make([]byte, len(code))
	syscall.PtracePeekData(pid, uintptr(breakpoint), original)
	syscall.PtracePokeData(pid, uintptr(breakpoint), code)
	return original
}
```
- Đoạn code này sẽ thay đổi data và stop chương trình ở nơi `breakpoint`.
- Tôi sẽ để thông tin [ở đây](https://man7.org/linux/man-pages/man2/ptrace.2.html), nếu bạn muốn biết thêm về `peek` và `poke` trong `ptrace()`.
![](https://gist.github.com/9bany/9e6b23e57eab9d1673c0d0f25fe1d482#file-main-go-L168-L174)

> Code này chỉ có thể chạy ở trên linux. nếu bạn dùng macOS thì sẽ không chạy được.

Source code tôi để [ở đây](#more)

## Summary
- Trên linux, debug hoạt động dựa trên một system call là `ptrace()`, tuy nhiên mỗi OS khác nhau thì system call dành cho debug sẽ khác nhau.
- Trên window có [Process monitor](https://en.wikipedia.org/wiki/Process_Monitor)  là một [sysinternal](https://en.wikipedia.org/wiki/Sysinternals) cho phép làm được điều khá tương tự như `ptrace()`.
- Trên MacOS, debug cũng dựa trên `ptrace()`, tuy nhiên về `interfaces` và cách hoạt động thì hoàn toàn khác nhau: [ptrace.2](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/ptrace.2.html)
- VD: Tool debug [Delve](https://github.com/go-delve/delve): Có một [interface](https://github.com/go-delve/delve/blob/master/service/debugger/debugger.go) chung cho debugger và `delve` [implemented interface](https://github.com/go-delve/delve/tree/3847b7a199793a7ff5bbdca0152544d5d34a88db/pkg/proc/native) này đối với từng OS khác nhau là hoàn toàn khác nhau, cách implement sẽ dựa vào cách thức mà OS đó hổ trợ debugging.

## More

- Source [code](https://gist.github.com/9bany/9e6b23e57eab9d1673c0d0f25fe1d482)
- ref: https://eli.thegreenplace.net/2011/01/23/how-debuggers-work-part-1

Thanks for your reading, `Chit chat!`.