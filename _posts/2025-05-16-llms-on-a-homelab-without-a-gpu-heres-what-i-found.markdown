---
title: LLMs on a Homelab Without a GPU? Here's What I Found
summary: Can integrated GPUs accelerate local LLMs? I explored running self-hosted
  models like Ollama with ROCm on an AMD 5600G-based homelab, but ran into kernel
  and memory allocation limitations. Here’s what I found and where things stand today.
tags:
- ollama
date: 2025-05-16 07:21
slug: llms-on-a-homelab-without-a-gpu-heres-what-i-found
---
I've recently been experimenting more with the power of Large Language Models (LLMs) and how they can supercharge my productivity. This especially has helped with the problem of a blank page wondering where to start writing – I can dump my unsorted thoughts into a chatbot and get a skeleton of a document or implementation in a few minutes. It's by no means perfect what comes out, but it's (usually) a very good start. I've been playing with both ChatGPT, and a series of local models running on my laptop with Ollama, Fabric, and OpenWebUI.

I wanted to be able to continue to use some of these self-hosted models while I'm out on the go, so I wondered - could I host these on my homelab server? My main homelab server runs an AMD Ryzen 5600G processor which includes an integrated GPU. Can this be used to improve the performance of a local model when I do not have a dedicated GPU available?

That doesn’t seem possible right now though, at least not in an efficient way. This post is a point-in-time snapshot of what I found when looking in to this.

<!--more-->

The core issue is a mismatch between how Ollama checks available VRAM on iGPUs and how ROCm (AMD's open-source stack designed for GPU compute) actually allocates memory. Specifically, ROCm uses a unified memory architecture and allocates from the system’s general memory pool (via **GTT – Graphics Translation Table**), rather than relying solely on a statically reserved VRAM segment.

There's an [unmerged pull request](https://github.com/ollama/ollama/pull/6282) in the Ollama repo that addresses an issue with how Ollama detects integrated GPUs (iGPUs) with sufficient memory when used with ROCm. However, the underlying Linux kernel changes that this PR relies on are only available starting from kernel **6.10**. As I was writing this the new TrueNAS “Fangtooth” release was just coming out, adopts kernel **6.12**, based on the [release notes](https://www.truenas.com/blog/truenas-fangtooth-25-04-release/).


To work around this in the current `ollama:rocm` container, you can reserve a chunk of system memory as VRAM through the BIOS. On my system, which has 32GB of RAM (with room to expand), setting aside 8GB for VRAM is manageable. However, on newer Linux kernels (version 6.10 and above), this reserved VRAM is essentially invisible to both ROCm and Ollama unless their GPU detection logic is patched. Without the patch, Ollama won't detect the iGPU unless some memory is reserved as VRAM — but even then, that reserved memory won't actually be used for running models, since GTT (which ROCm uses for memory allocation) can't access it. So, that reserved space ends up being wasted.



**Next Steps:**
I'm going to put a pin in this for a few weeks and check back on the status of [PR #6282](https://github.com/ollama/ollama/pull/6282). It's likely going to be necessary to make integrated GPU support with ROCm fully functional under the newer kernel, so I'll largely stick to experimenting with ChatGPT and models locally on my laptop as the Apple Silicon processors seem to be pretty quick for processing models (even if my M1 is a good few years old now). CPU only processing on the 5600G seems to be an order of magnitude slower than on my M1 processor, so I'll need either to wait on this iGPU support or invest in a dedicated GPU for this purpose (which I don't feel the need to do with my current level of usage).
