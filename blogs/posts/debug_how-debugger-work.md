---
title: Debugger hoạt động thế nào ? 
author: rony
publish_date: 2023-01-03T00:00:00.000Z
abstract: Chui vào xem sao =)) 
---

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

ve## Build debugger

Có một đoạn code Golang như sau:

```golang
// main.go file
package main

import "fmt"

func main() {
	name := "rony"
	fmt.Println("Hello ", bany)
}

```

Tools dùng để bugger golang (vd: [delve](https://github.com/go-delve/delve)) thì có vẻ rất lớn và phức tạp, trong khi nền tảng để xây dựng chúng thì lại khá là đơn giản, sử dụng services được cung cấp bởi hệ điều hành như tôi có nhắc ở phần trên [linux-ptrace](#linux---ptrace).

Cho nên, chúng ta sẽ viết một chương trình đơn giản để debug đoạn code trên. All the rest is just a [simple matter of programming](https://en.wikipedia.org/wiki/Small_matter_of_programming)

### 1. Build binary 
Code structure tôi sẽ để như sau:
```
├── hello
│   └── main.go        	# <-- đây là chương trình cần debug
├── main.go				# <-- đây là chường trình debug
```
Chúng ta sẽ build chương trình debug với `-gcflags=all="-N -l"`. mình sẽ để [link](https://go.dev/doc/gdb) ở đây. để biết tại sao mình lại cần `flags` đó.
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
### 2. Program counter and Code assembly

### 3. Let's build debugger 

![](https://gist.github.com/9bany/9e6b23e57eab9d1673c0d0f25fe1d482#file-main-go-L168-L174)

## Summary

## More

- Source [code](https://gist.github.com/9bany/9e6b23e57eab9d1673c0d0f25fe1d482)